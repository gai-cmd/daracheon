import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject?: string;
  message: string;
  date: string;
  status: string;
  reply?: string;
  replyAt?: string;
  replyBy?: string;
}

const validStatuses = ['new', 'replied', 'resolved', 'pending', 'in-progress', 'closed'] as const;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inquiries = await readData('inquiries');
    return NextResponse.json({
      inquiries,
      total: inquiries.length,
    });
  } catch (error) {
    console.error('[Admin Inquiries] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: '문의 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const inquiries = await readData('inquiries');
    const index = inquiries.findIndex((inq) => inq.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const previousStatus = inquiries[index].status;
    const previousReply = inquiries[index].reply;
    const updated: Inquiry = { ...inquiries[index], status: body.status };

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
        subject: '[대라천] 문의하신 내용에 답변이 도착했습니다',
        html,
        text: `안녕하세요, ${updated.name}님.\n\n문의하신 내용에 대한 답변입니다.\n\n[답변 내용]\n${updated.reply}\n\n감사합니다.\nZOEL LIFE · 대라천\n전화: 070-4140-4086`,
      }).catch((err: unknown) => {
        console.error('[Admin Inquiries] sendEmail error:', err);
      });
    }

    const replyUpdated = typeof body.reply === 'string';
    // PII (고객 이름) 는 감사 로그 summary 에서 제외. targetId 로 역추적.
    await logAdmin('inquiries', replyUpdated ? 'reply' : 'status_change', {
      targetId: body.id,
      summary: replyUpdated
        ? `문의 답변 작성 (${body.id})`
        : `문의 상태 변경: ${previousStatus} → ${body.status}`,
      meta: { previousStatus, newStatus: body.status },
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

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: '문의 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const inquiries = await readData('inquiries');
    const index = inquiries.findIndex((inq) => inq.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    inquiries.splice(index, 1);
    await writeData('inquiries', inquiries);

    await logAdmin('inquiries', 'delete', {
      targetId: body.id,
      summary: `문의 삭제 (${body.id})`,
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
