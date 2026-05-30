import { NextResponse } from 'next/server';
import { readDataUncached, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';
import { snapshotBeforeDestructive } from '@/lib/backup';
import { notifyTelegramReply, updateGoogleSheetReply, updateGoogleSheetMeta } from '@/lib/integrations';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;    // 회사명
  category: string;
  subject?: string;
  message: string;
  date: string;
  status: string;
  reply?: string;
  replyAt?: string;
  replyBy?: string;
  assignee?: string;   // 담당자
  dueDate?: string;    // 답변기한 (YYYY-MM-DD)
  resolvedAt?: string; // 완료일 (ISO). status='resolved' 일 때 자동 세팅.
}

const validStatuses = ['new', 'replied', 'resolved', 'pending', 'in-progress', 'closed'] as const;

export const dynamic = 'force-dynamic';

// 응답 자체에 no-store 헤더 — 브라우저/엣지 어느 레이어도 어드민 데이터를
// 캐싱하지 않도록. 삭제 직후 옛 응답이 되살아나는 "ghost restore" 방지.
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    const inquiries = await readDataUncached('inquiries');
    return NextResponse.json(
      { inquiries, total: inquiries.length },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('[Admin Inquiries] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Bulk path: body.ids = string[]. 같은 Lambda 인스턴스에서 1번의
    // read-modify-write 로 N건 처리 → Vercel Blob 의 list() propagation
    // lag 으로 인한 cross-Lambda race 차단 (단일 PATCH 직렬화로는 못 막음).
    if (Array.isArray(body.ids)) {
      if (body.ids.length === 0) {
        return NextResponse.json(
          { success: false, message: 'ids 배열이 비어있습니다.' },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }
      if (!body.status || !validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: `유효하지 않은 상태: ${validStatuses.join(', ')}` },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }
      const ids: string[] = body.ids.filter((x: unknown): x is string => typeof x === 'string');
      const inquiries = await readDataUncached('inquiries');
      const updatedIds: string[] = [];
      const notFoundIds: string[] = [];
      for (const id of ids) {
        const idx = inquiries.findIndex((inq) => inq.id === id);
        if (idx === -1) { notFoundIds.push(id); continue; }
        const prevStatus = inquiries[idx].status;
        const next: Inquiry = { ...inquiries[idx], status: body.status };
        // resolved 진입/이탈에 따라 완료일 자동 관리 (단일 PATCH 와 동일 규칙).
        if (body.status === 'resolved' && !next.resolvedAt) {
          next.resolvedAt = new Date().toISOString();
        } else if (prevStatus === 'resolved' && body.status !== 'resolved') {
          delete next.resolvedAt;
        }
        inquiries[idx] = next;
        updatedIds.push(id);
      }
      if (updatedIds.length > 0) {
        await writeData('inquiries', inquiries);
      }
      // 시트 E·H 컬럼 동기화 — 행 단위 호출이라 N건이면 N API 호출.
      // fire-and-forget: 시트 실패가 어드민 응답을 막지 않도록.
      for (const id of updatedIds) {
        const target = inquiries.find((q) => q.id === id);
        updateGoogleSheetMeta({
          inquiryId: id,
          status: body.status,
          resolvedAt:
            body.status === 'resolved'
              ? (target?.resolvedAt ?? new Date().toISOString())
              : '',
        }).then((r) => {
          if (!r.ok && !r.skipped) {
            console.error('[Admin Inquiries] bulk updateGoogleSheetMeta error:', id, r.error);
          }
        }).catch((err: unknown) => {
          console.error('[Admin Inquiries] bulk updateGoogleSheetMeta threw:', id, err);
        });
      }
      await logAdmin('inquiries', 'status_change', {
        summary: `문의 일괄 상태 변경: ${updatedIds.length}건 → ${body.status}`,
        meta: { ids: updatedIds, notFoundIds, newStatus: body.status, count: updatedIds.length },
      });
      return NextResponse.json(
        {
          success: true,
          message: `${updatedIds.length}건 상태 변경됨${notFoundIds.length ? `, ${notFoundIds.length}건 누락` : ''}`,
          updatedIds,
          notFoundIds,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: '문의 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 담당자/예정일만 갱신할 때는 status 생략 허용. 제공되면 유효성 검사.
    if (body.status !== undefined && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const inquiries = await readDataUncached('inquiries');
    const index = inquiries.findIndex((inq) => inq.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const previousStatus = inquiries[index].status;
    const previousReply = inquiries[index].reply;
    const previousAssignee = inquiries[index].assignee;
    const previousDueDate = inquiries[index].dueDate;
    const previousCompany = inquiries[index].company;
    const nextStatus = body.status ?? previousStatus;
    const updated: Inquiry = { ...inquiries[index], status: nextStatus };

    // 완료일(resolvedAt) 자동 관리. resolved 로 전환되는 첫 시점에 ISO 기록.
    // resolved 에서 빠져나가면 비움 — 사용자가 상태를 되돌렸을 때 완료일이 남아있으면 혼란.
    if (nextStatus === 'resolved') {
      if (!updated.resolvedAt) updated.resolvedAt = new Date().toISOString();
    } else if (previousStatus === 'resolved' && nextStatus !== 'resolved') {
      delete updated.resolvedAt;
    }

    let assigneeChanged = false;
    let dueDateChanged = false;
    let companyChanged = false;

    if (typeof body.company === 'string') {
      const trimmed = body.company.trim();
      if (trimmed.length > 0) {
        if (trimmed !== previousCompany) companyChanged = true;
        updated.company = trimmed;
      } else {
        if (previousCompany !== undefined) companyChanged = true;
        delete updated.company;
      }
    }

    if (typeof body.assignee === 'string') {
      const trimmed = body.assignee.trim();
      if (trimmed.length > 0) {
        if (trimmed !== previousAssignee) assigneeChanged = true;
        updated.assignee = trimmed;
      } else {
        if (previousAssignee !== undefined) assigneeChanged = true;
        delete updated.assignee;
      }
    }

    if (typeof body.dueDate === 'string') {
      const trimmed = body.dueDate.trim();
      if (trimmed.length > 0) {
        if (trimmed !== previousDueDate) dueDateChanged = true;
        updated.dueDate = trimmed;
      } else {
        if (previousDueDate !== undefined) dueDateChanged = true;
        delete updated.dueDate;
      }
    }

    let isNewReply = false;

    if (typeof body.reply === 'string') {
      const trimmed = body.reply.trim();
      if (trimmed.length > 0) {
        // 기존 reply와 다를 때만 새 답변으로 간주
        if (trimmed !== previousReply) {
          isNewReply = true;
        }
        updated.reply = trimmed;
        updated.replyAt = new Date().toISOString();
        if (typeof body.replyBy === 'string' && body.replyBy.trim()) {
          updated.replyBy = body.replyBy.trim();
        }
      } else {
        delete updated.reply;
        delete updated.replyAt;
        delete updated.replyBy;
      }
    }

    inquiries[index] = updated;
    await writeData('inquiries', inquiries);

    // 새 답변이 작성되었을 때 고객에게 이메일 발송
    if (isNewReply && updated.email && updated.reply) {
      const adminEmail = process.env.ADMIN_EMAIL ?? 'info@daeracheon.com';
      const categoryLabel: Record<string, string> = {
        product: '제품 문의',
        order: '주문 문의',
        wholesale: '도매 문의',
        media: '미디어 문의',
        other: '기타 문의',
      };
      const catDisplay = categoryLabel[updated.category] ?? updated.category;
      const subjectDisplay = updated.subject ?? updated.message.slice(0, 40);

      const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /></head>
<body style="font-family: 'Apple SD Gothic Neo', '맑은 고딕', sans-serif; background:#f9f9f9; margin:0; padding:0;">
  <div style="max-width:600px; margin:32px auto; background:#fff; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
    <div style="background:#1a1a0e; padding:28px 32px;">
      <p style="color:#c9a84c; font-size:13px; letter-spacing:0.12em; margin:0 0 6px;">ZOEL LIFE · 대라천</p>
      <h1 style="color:#fff; font-size:20px; margin:0;">문의 답변이 도착했습니다</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#444; font-size:14px; line-height:1.8; margin:0 0 24px;">
        안녕하세요, <strong>${updated.name}</strong>님.<br />
        대라천을 찾아주셔서 감사합니다.<br />
        문의하신 내용에 대한 답변을 아래와 같이 안내드립니다.
      </p>

      <div style="background:#f5f3ee; border-left:3px solid #c9a84c; padding:16px 20px; border-radius:4px; margin-bottom:20px;">
        <p style="font-size:12px; color:#888; margin:0 0 6px;">문의 유형: ${catDisplay}</p>
        <p style="font-size:14px; color:#333; font-weight:600; margin:0;">${subjectDisplay}</p>
      </div>

      <div style="background:#fff; border:1px solid #e5e5e5; border-radius:6px; padding:20px; margin-bottom:28px;">
        <p style="font-size:12px; color:#888; margin:0 0 10px; text-transform:uppercase; letter-spacing:0.08em;">답변 내용</p>
        <p style="font-size:14px; color:#333; line-height:1.9; margin:0; white-space:pre-wrap;">${updated.reply}</p>
      </div>

      <p style="font-size:13px; color:#666; line-height:1.8; margin:0 0 24px;">
        추가로 궁금하신 사항이 있으시면 언제든지 문의해 주세요.
      </p>

      <div style="border-top:1px solid #eee; padding-top:20px; font-size:12px; color:#999; line-height:1.8;">
        <strong style="color:#555;">ZOEL LIFE · 대라천</strong><br />
        이메일: ${adminEmail}<br />
        전화: 070-4140-4086<br />
        <span style="font-size:11px;">평일 09:00 - 18:00 (점심 12:00 - 13:00 / 주말·공휴일 휴무)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

      sendEmail({
        to: updated.email,
        // 제목 끝의 [#inq-...] 토큰 — 고객 답장을 인박스 폴링이 이 문의로
        // 매칭하는 키. 절대 제거 금지.
        subject: `[대라천] 문의하신 내용에 답변이 도착했습니다 [#${updated.id}]`,
        html,
        text: `안녕하세요, ${updated.name}님.\n\n문의하신 내용에 대한 답변입니다.\n\n[답변 내용]\n${updated.reply}\n\n감사합니다.\nZOEL LIFE · 대라천\n전화: 070-4140-4086`,
      }).catch((err: unknown) => {
        console.error('[Admin Inquiries] sendEmail error:', err);
      });

      // 답변 작성 시 텔레그램 채널에도 발송. 메일은 고객용, 텔레그램은
      // 운영팀 공유용. 실패해도 어드민 응답에는 영향 없도록 fire-and-forget.
      notifyTelegramReply({
        inquiryId: updated.id,
        customerName: updated.name,
        customerCompany: updated.company,
        customerEmail: updated.email,
        categoryLabel: catDisplay,
        subject: subjectDisplay,
        question: updated.message,
        reply: updated.reply,
        repliedBy: updated.replyBy,
        assignee: updated.assignee,
        dueDate: updated.dueDate,
        status: updated.status,
        resolvedAt: updated.resolvedAt,
      }).then((r) => {
        if (!r.ok && !r.skipped) {
          console.error('[Admin Inquiries] notifyTelegramReply error:', r.error);
        }
      }).catch((err: unknown) => {
        console.error('[Admin Inquiries] notifyTelegramReply threw:', err);
      });

      // Google Sheets 의 동일 ID 행에 답변 컬럼(I·J·K) 갱신. fire-and-forget.
      updateGoogleSheetReply({
        inquiryId: updated.id,
        replyAt: updated.replyAt ?? new Date().toISOString(),
        replyBy: updated.replyBy,
        reply: updated.reply,
        assignee: updated.assignee,
        dueDate: updated.dueDate,
        status: updated.status,
        resolvedAt: updated.resolvedAt,
      }).then((r) => {
        if (!r.ok && !r.skipped) {
          console.error('[Admin Inquiries] updateGoogleSheetReply error:', r.error);
        }
      }).catch((err: unknown) => {
        console.error('[Admin Inquiries] updateGoogleSheetReply threw:', err);
      });
    } else if (assigneeChanged || dueDateChanged || companyChanged || previousStatus !== nextStatus) {
      // 답변 본문은 안 건드렸지만 담당자/기한/상태가 바뀐 경우 — 시트 메타만 갱신.
      // (답변 보낼 때는 updateGoogleSheetReply 가 이미 메타까지 동기화하므로 중복 호출 안 함)
      updateGoogleSheetMeta({
        inquiryId: updated.id,
        status: previousStatus !== nextStatus ? updated.status : undefined,
        assignee: assigneeChanged ? (updated.assignee ?? '') : undefined,
        dueDate: dueDateChanged ? (updated.dueDate ?? '') : undefined,
        // 완료일은 상태 변동에 종속. resolved 진입 시 세팅, 이탈 시 클리어.
        resolvedAt:
          previousStatus !== nextStatus
            ? nextStatus === 'resolved'
              ? updated.resolvedAt
              : ''
            : undefined,
      }).then((r) => {
        if (!r.ok && !r.skipped) {
          console.error('[Admin Inquiries] updateGoogleSheetMeta error:', r.error);
        }
      }).catch((err: unknown) => {
        console.error('[Admin Inquiries] updateGoogleSheetMeta threw:', err);
      });
    }

    const replyUpdated = typeof body.reply === 'string';
    // PII (고객 이름) 는 감사 로그 summary 에서 제외. targetId 로 역추적.
    await logAdmin('inquiries', replyUpdated ? 'reply' : 'status_change', {
      targetId: body.id,
      summary: replyUpdated
        ? `문의 답변 작성 (${body.id})`
        : `문의 상태 변경: ${previousStatus} → ${nextStatus}`,
      meta: {
        previousStatus,
        newStatus: nextStatus,
        assigneeChanged,
        dueDateChanged,
        companyChanged,
      },
    });

    return NextResponse.json({
      success: true,
      message: `문의 ${body.id}가 업데이트되었습니다.`,
      inquiry: inquiries[index],
    });
  } catch (error) {
    console.error('[Admin Inquiries] PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    // Bulk path: body.ids = string[]. 한 번의 read-modify-write 로 N건 삭제 →
    // 건별 DELETE 직렬 호출의 cross-Lambda race (Blob list() propagation lag)
    // 차단. 일괄 상태변경(PATCH)과 동일한 방어 패턴.
    if (Array.isArray(body.ids)) {
      const ids: string[] = body.ids.filter((x: unknown): x is string => typeof x === 'string');
      if (ids.length === 0) {
        return NextResponse.json(
          { success: false, message: 'ids 배열이 비어있습니다.' },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }
      const inquiries = await readDataUncached('inquiries');
      const idSet = new Set(ids);
      const deletedIds = inquiries.filter((inq) => idSet.has(inq.id)).map((inq) => inq.id);
      const notFoundIds = ids.filter((id) => !deletedIds.includes(id));

      if (deletedIds.length === 0) {
        return NextResponse.json(
          { success: false, message: '삭제할 문의를 찾을 수 없습니다.', notFoundIds },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }

      // 고객 PII 다건 삭제 전 1회 스냅샷 — 실수·악의적 일괄 삭제 시 복원 가능.
      // 실패해도 삭제는 진행 (백업이 삭제를 막으면 안 됨, 단일 삭제와 동일 정책).
      const snapId = await snapshotBeforeDestructive(
        undefined,
        `inquiries bulk delete ${deletedIds.length}건`,
      );

      const remaining = inquiries.filter((inq) => !idSet.has(inq.id));
      await writeData('inquiries', remaining);

      await logAdmin('inquiries', 'delete', {
        summary: `문의 일괄 삭제: ${deletedIds.length}건`,
        meta: {
          ids: deletedIds,
          notFoundIds,
          count: deletedIds.length,
          ...(snapId ? { preDeleteSnapshot: snapId } : {}),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `${deletedIds.length}건 삭제됨${notFoundIds.length ? `, ${notFoundIds.length}건 누락` : ''}`,
          deletedIds,
          notFoundIds,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: '문의 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const inquiries = await readDataUncached('inquiries');
    const index = inquiries.findIndex((inq) => inq.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 고객 PII 삭제 전 자동 스냅샷 — 실수·악의적 삭제 시 즉시 복원 가능.
    // 실패해도 삭제는 진행 (백업이 데이터 삭제를 막으면 안 됨).
    const snapId = await snapshotBeforeDestructive(undefined, `inquiries delete ${body.id}`);

    inquiries.splice(index, 1);
    await writeData('inquiries', inquiries);

    await logAdmin('inquiries', 'delete', {
      targetId: body.id,
      summary: `문의 삭제 (${body.id})`,
      meta: snapId ? { preDeleteSnapshot: snapId } : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `문의 ${body.id}가 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('[Admin Inquiries] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
