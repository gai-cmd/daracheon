import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readData, writeData } from '@/lib/db';
import { sendEmail } from '@/lib/mail';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  date: string;
  status: string;
}

const contactSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(50),
  email: z.string().email('올바른 이메일 주소를 입력해 주세요.'),
  phone: z.string().max(20).optional().default(''),
  category: z.enum(['product', 'order', 'wholesale', 'media', 'other']).optional().default('product'),
  subject: z.string().max(200).optional().default(''),
  message: z.string().min(10, '문의 내용을 10자 이상 입력해 주세요.').max(2000),
});

const categoryLabel: Record<string, string> = {
  product: '제품',
  order: '주문',
  wholesale: '도매',
  media: '미디어',
  other: '기타',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    const inquiries = await readData('inquiries');

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      category: validated.category,
      subject: validated.subject,
      message: validated.message,
      date: new Date().toISOString().split('T')[0],
      status: 'new',
    };

    inquiries.push(newInquiry);
    await writeData('inquiries', inquiries);

    console.log('[Contact Form] 새 문의 접수:', newInquiry.id);

    // 고객 접수 확인 메일 (dry-run 허용)
    const subjectLine = validated.subject ? `[${validated.subject}] ` : '';
    sendEmail({
      to: validated.email,
      subject: `[대라천] ${subjectLine}문의가 접수되었습니다.`,
      text: `안녕하세요, ${validated.name}님.\n\n문의해 주셔서 감사합니다.\n문의 내용이 정상적으로 접수되었으며, 영업일 기준 1~2일 이내에 답변 드리겠습니다.\n\n─────────────────────────\n[문의 유형] ${categoryLabel[validated.category] ?? validated.category}${validated.subject ? `\n[제목] ${validated.subject}` : ''}\n[문의 내용]\n${validated.message}\n─────────────────────────\n\n대라천 고객지원팀 드림`,
      html: `<p>안녕하세요, <strong>${validated.name}</strong>님.</p>
<p>문의해 주셔서 감사합니다.<br>문의 내용이 정상적으로 접수되었으며, 영업일 기준 1~2일 이내에 답변 드리겠습니다.</p>
<hr>
<p><strong>문의 유형:</strong> ${categoryLabel[validated.category] ?? validated.category}${validated.subject ? `<br><strong>제목:</strong> ${validated.subject}` : ''}<br>
<strong>문의 내용:</strong><br>${validated.message.replace(/\n/g, '<br>')}</p>
<hr>
<p>대라천 고객지원팀 드림</p>`,
    }).catch((err) => console.error('[Contact Form] 고객 메일 발송 오류:', err));

    // 관리자 알림 메일 (dry-run 허용)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `[대라천 관리자] 새 문의 접수 — ${validated.name} (${categoryLabel[validated.category] ?? validated.category})${validated.subject ? ` / ${validated.subject}` : ''}`,
        text: `새 문의가 접수되었습니다.\n\n이름: ${validated.name}\n이메일: ${validated.email}\n전화: ${validated.phone || '없음'}\n유형: ${categoryLabel[validated.category] ?? validated.category}${validated.subject ? `\n제목: ${validated.subject}` : ''}\n내용:\n${validated.message}`,
        html: `<p><strong>새 문의가 접수되었습니다.</strong></p>
<ul>
  <li><strong>이름:</strong> ${validated.name}</li>
  <li><strong>이메일:</strong> ${validated.email}</li>
  <li><strong>전화:</strong> ${validated.phone || '없음'}</li>
  <li><strong>유형:</strong> ${categoryLabel[validated.category] ?? validated.category}</li>
${validated.subject ? `  <li><strong>제목:</strong> ${validated.subject}</li>\n` : ''}</ul>
<p><strong>내용:</strong><br>${validated.message.replace(/\n/g, '<br>')}</p>`,
      }).catch((err) => console.error('[Contact Form] 관리자 메일 발송 오류:', err));
    }

    return NextResponse.json(
      { success: true, message: '문의가 성공적으로 접수되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    console.error('[Contact Form Error]', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
