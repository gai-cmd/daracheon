import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  addPayment,
  listPayments,
} from '@/lib/ai-tools/store';
import { buildSummary } from '@/lib/ai-tools/summary';
import { formatJpy, formatAmount } from '@/lib/ai-tools/currency';
import { notifyChange } from '@/lib/ai-tools/slack';
import type { Currency, ToolStatus, DataState } from '@/lib/ai-tools/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * MCP 서버 (streamable HTTP, JSON-RPC 2.0) — 설계서 ⑦.
 *
 * Claude(Cowork·Code)에서 "이번 달 방글팀 AI 비용?" 같은 자연어 조회를 즉답하고,
 * 승인 하에 등록·수정·결제 기록을 남긴다.
 *
 * 의존성 없이 최소 구현: initialize / tools/list / tools/call / ping 처리.
 * 인증은 Authorization: Bearer 로 read/write 토큰 분리 (설계서 ⑦ 구현 메모).
 *   AI_TOOLS_MCP_READ_TOKEN   조회 툴만 허용
 *   AI_TOOLS_MCP_WRITE_TOKEN  조회 + 쓰기 툴 허용
 * write 호출은 슬랙에 변경 통지(감사 로그)를 남긴다.
 */

type Access = 'none' | 'read' | 'write';

function tokenEq(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function authLevel(request: NextRequest): Access {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return 'none';
  const write = process.env.AI_TOOLS_MCP_WRITE_TOKEN?.trim();
  const read = process.env.AI_TOOLS_MCP_READ_TOKEN?.trim();
  if (write && tokenEq(token, write)) return 'write';
  if (read && tokenEq(token, read)) return 'read';
  return 'none';
}

/* ───────── 툴 정의 ───────── */

interface McpTool {
  name: string;
  description: string;
  access: 'read' | 'write';
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, actor: string) => Promise<unknown>;
}

const TOOLS: McpTool[] = [
  {
    name: 'list_ai_tools',
    description: '등록된 AI툴 목록을 조회한다. team(팀 id)·status·data_state 로 필터.',
    access: 'read',
    inputSchema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: '팀 id (선택)' },
        status: { type: 'string', enum: ['active', 'trial', 'review', 'cancelled'] },
        data_state: { type: 'string', enum: ['confirmed', 'estimated', 'todo'] },
      },
    },
    handler: async (args) => {
      const tools = await listTools({
        teamId: (args.team as string) || undefined,
        status: (args.status as ToolStatus) || undefined,
        dataState: (args.data_state as DataState) || undefined,
      });
      return tools.map((t) => ({
        id: t.id,
        name: t.name,
        vendor: t.vendor,
        plan: t.plan,
        status: t.status,
        data_state: t.dataState,
        monthly_cost: t.monthlyCost,
        currency: t.currency,
      }));
    },
  },
  {
    name: 'get_monthly_cost',
    description:
      '월 비용 합계를 JPY 로 조회한다. team 지정 시 해당 팀만. 미확정(+α) 건수 포함.',
    access: 'read',
    inputSchema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: '팀 id (선택). 미지정 시 전사 합계' },
      },
    },
    handler: async (args) => {
      const summary = await buildSummary();
      const teamId = (args.team as string) || undefined;
      if (teamId) {
        const row = summary.byTeam.find((t) => t.teamId === teamId);
        return {
          scope: 'team',
          team_id: teamId,
          team_name: row?.teamName ?? '(알 수 없음)',
          monthly_jpy: row?.monthlyJpy ?? 0,
          monthly_label: formatJpy(row?.monthlyJpy ?? 0),
          tool_count: row?.toolCount ?? 0,
          unconfirmed_count: row?.unconfirmedCount ?? 0,
        };
      }
      return {
        scope: 'company',
        monthly_jpy: summary.totalMonthlyJpy,
        monthly_label: `${formatJpy(summary.totalMonthlyJpy)}${summary.unconfirmedCount > 0 ? ' +α' : ''}`,
        unconfirmed_count: summary.unconfirmedCount,
        by_team: summary.byTeam.map((t) => ({
          team_name: t.teamName,
          monthly_jpy: t.monthlyJpy,
          unconfirmed_count: t.unconfirmedCount,
        })),
      };
    },
  },
  {
    name: 'register_tool',
    description: '새 AI툴을 등록한다. name 필수. 금액 미입력 시 data_state=todo 로 저장.',
    access: 'write',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        vendor: { type: 'string' },
        category: { type: 'string' },
        team_id: { type: 'string' },
        account_email: { type: 'string' },
        plan: { type: 'string' },
        currency: { type: 'string', enum: ['USD', 'JPY', 'KRW', 'BDT'] },
        monthly_cost: { type: 'number' },
        billing_day: { type: 'number' },
        payment_method: { type: 'string' },
        status: { type: 'string', enum: ['active', 'trial', 'review', 'cancelled'] },
        owner: { type: 'string' },
        note: { type: 'string' },
        url: { type: 'string', description: '서비스·콘솔 URL (비밀값 금지 — 링크만)' },
        started_on: { type: 'string', description: 'YYYY-MM-DD' },
        cancelled_on: { type: 'string', description: 'YYYY-MM-DD 해지일 (해지분 소급 등록용)' },
        evidence_url: { type: 'string', description: '영수증·청구서·슬랙 링크 (비밀값 금지)' },
      },
    },
    handler: async (args, actor) => {
      const tool = await createTool({
        url: args.url as string,
        startedOn: args.started_on as string,
        cancelledOn: args.cancelled_on as string,
        evidenceUrl: args.evidence_url as string,
        name: args.name as string,
        vendor: args.vendor as string,
        category: args.category as string,
        teamId: args.team_id as string,
        accountEmail: args.account_email as string,
        plan: args.plan as string,
        currency: args.currency as Currency,
        monthlyCost: args.monthly_cost as number,
        billingDay: args.billing_day as number,
        paymentMethod: args.payment_method as string,
        status: args.status as ToolStatus,
        owner: args.owner as string,
        note: args.note as string,
      });
      notifyChange({
        action: '등록 (MCP)',
        toolName: tool.name,
        by: actor,
        detail: `${tool.plan ?? ''} ${formatAmount(tool.monthlyCost, tool.currency)}`.trim(),
      }).catch(() => {});
      return { id: tool.id, name: tool.name, data_state: tool.dataState };
    },
  },
  {
    name: 'update_tool',
    description: 'AI툴을 수정한다. id 필수. 상태 변경(해지 등) 포함.',
    access: 'write',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        plan: { type: 'string' },
        currency: { type: 'string', enum: ['USD', 'JPY', 'KRW', 'BDT'] },
        monthly_cost: { type: 'number' },
        billing_day: { type: 'number' },
        status: { type: 'string', enum: ['active', 'trial', 'review', 'cancelled'] },
        data_state: { type: 'string', enum: ['confirmed', 'estimated', 'todo'] },
        owner: { type: 'string' },
        note: { type: 'string' },
        name: { type: 'string' },
        vendor: { type: 'string' },
        category: { type: 'string' },
        team_id: { type: 'string' },
        account_email: { type: 'string' },
        payment_method: { type: 'string' },
        url: { type: 'string' },
        started_on: { type: 'string', description: 'YYYY-MM-DD' },
        cancelled_on: {
          type: 'string',
          description: 'YYYY-MM-DD 해지일. status=cancelled 인데 미지정이면 오늘로 자동 기록.',
        },
        cost_source: {
          type: 'string',
          enum: ['', 'anthropic-api', 'openai-api'],
          description: '비용 자동수집 어댑터. 빈 값이면 수동·청구메일 경로.',
        },
        evidence_url: { type: 'string', description: '영수증·청구서 링크 (비밀값 금지)' },
      },
    },
    handler: async (args, actor) => {
      const id = args.id as string;
      const patch: Record<string, unknown> = {};
      if ('name' in args) patch.name = args.name;
      if ('vendor' in args) patch.vendor = args.vendor;
      if ('category' in args) patch.category = args.category;
      if ('team_id' in args) patch.teamId = args.team_id;
      if ('account_email' in args) patch.accountEmail = args.account_email;
      if ('payment_method' in args) patch.paymentMethod = args.payment_method;
      if ('url' in args) patch.url = args.url;
      if ('started_on' in args) patch.startedOn = args.started_on;
      if ('cancelled_on' in args) patch.cancelledOn = args.cancelled_on;
      if ('cost_source' in args) patch.costSource = args.cost_source;
      if ('evidence_url' in args) patch.evidenceUrl = args.evidence_url;
      if ('plan' in args) patch.plan = args.plan;
      if ('currency' in args) patch.currency = args.currency;
      if ('monthly_cost' in args) patch.monthlyCost = args.monthly_cost;
      if ('billing_day' in args) patch.billingDay = args.billing_day;
      if ('status' in args) patch.status = args.status;
      if ('data_state' in args) patch.dataState = args.data_state;
      if ('owner' in args) patch.owner = args.owner;
      if ('note' in args) patch.note = args.note;
      const tool = await updateTool(id, patch as Parameters<typeof updateTool>[1]);
      if (!tool) throw new Error(`툴을 찾을 수 없습니다: ${id}`);
      notifyChange({
        action: tool.status === 'cancelled' ? '해지 (MCP)' : '수정 (MCP)',
        toolName: tool.name,
        by: actor,
      }).catch(() => {});
      return { id: tool.id, name: tool.name, status: tool.status };
    },
  },
  {
    name: 'log_payment',
    description: '결제 실적을 기록한다. tool_id·paid_on·amount·currency 필수.',
    access: 'write',
    inputSchema: {
      type: 'object',
      required: ['tool_id', 'paid_on', 'amount', 'currency'],
      properties: {
        tool_id: { type: 'string' },
        paid_on: { type: 'string', description: 'YYYY-MM-DD' },
        amount: { type: 'number' },
        currency: { type: 'string', enum: ['USD', 'JPY', 'KRW', 'BDT'] },
        receipt_url: { type: 'string' },
      },
    },
    handler: async (args, actor) => {
      const toolId = args.tool_id as string;
      const tool = await getTool(toolId);
      if (!tool) throw new Error(`툴을 찾을 수 없습니다: ${toolId}`);
      const payment = await addPayment(toolId, {
        paidOn: args.paid_on as string,
        amount: Number(args.amount),
        currency: args.currency as Currency,
        receiptUrl: args.receipt_url as string,
      });
      notifyChange({
        action: '결제 기록 (MCP)',
        toolName: tool.name,
        by: actor,
        detail: `${payment.paidOn} ${formatAmount(payment.amount, payment.currency)}`,
      }).catch(() => {});
      return { id: payment.id, tool_id: toolId, amount_jpy: payment.amountJpy };
    },
  },
  {
    // 영수증·금액을 외부(메일·카드명세·벤더 API)에서 끌어와 채워 넣으려면,
    // 먼저 "이 툴의 현재 값이 무엇이고 어디까지 확정인지" 를 읽을 수 있어야 한다.
    name: 'get_tool',
    description:
      'AI툴 1건의 전체 필드(계정·URL·영수증 링크·확정 상태)와 결제 이력을 조회한다. id 필수.',
    access: 'read',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    handler: async (args) => {
      const id = args.id as string;
      const tool = await getTool(id);
      if (!tool) throw new Error(`툴을 찾을 수 없습니다: ${id}`);
      const payments = await listPayments(id);
      return {
        tool,
        payments: payments.map((p) => ({
          id: p.id,
          paid_on: p.paidOn,
          amount: p.amount,
          currency: p.currency,
          amount_jpy: p.amountJpy,
          receipt_url: p.receiptUrl,
        })),
      };
    },
  },
  {
    name: 'list_payments',
    description:
      '결제 실적(영수증 링크 포함)을 조회한다. tool_id 미지정 시 전체. from·to 로 기간 필터(YYYY-MM-DD).',
    access: 'read',
    inputSchema: {
      type: 'object',
      properties: {
        tool_id: { type: 'string' },
        from: { type: 'string', description: 'YYYY-MM-DD (이상)' },
        to: { type: 'string', description: 'YYYY-MM-DD (이하)' },
      },
    },
    handler: async (args) => {
      const rows = await listPayments((args.tool_id as string) || undefined);
      const from = (args.from as string) || undefined;
      const to = (args.to as string) || undefined;
      return rows
        .filter((p) => (!from || p.paidOn >= from) && (!to || p.paidOn <= to))
        .map((p) => ({
          id: p.id,
          tool_id: p.toolId,
          paid_on: p.paidOn,
          amount: p.amount,
          currency: p.currency,
          amount_jpy: p.amountJpy,
          receipt_url: p.receiptUrl,
        }));
    },
  },
  {
    name: 'delete_tool',
    description:
      '오등록·중복 레코드를 삭제한다. id 필수. 해지는 삭제가 아니라 update_tool(status=cancelled) 로 남긴다.',
    access: 'write',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    handler: async (args, actor) => {
      const id = args.id as string;
      const tool = await getTool(id);
      if (!tool) throw new Error(`툴을 찾을 수 없습니다: ${id}`);
      await deleteTool(id);
      notifyChange({ action: '삭제 (MCP)', toolName: tool.name, by: actor }).catch(() => {});
      return { ok: true, id, name: tool.name };
    },
  },
];

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/* ───────── JSON-RPC ───────── */

const PROTOCOL_VERSION = '2024-11-05';

interface RpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}
function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function toolContent(payload: unknown, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    isError,
  };
}

async function handleRpc(req: RpcRequest, access: Access, actor: string) {
  switch (req.method) {
    case 'initialize':
      return rpcResult(req.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'ai-tools-crm', version: '1.0.0' },
      });
    case 'ping':
      return rpcResult(req.id, {});
    case 'tools/list': {
      const visible = TOOLS.filter((t) => access === 'write' || t.access === 'read');
      return rpcResult(req.id, {
        tools: visible.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
    }
    case 'tools/call': {
      const name = req.params?.name as string;
      const args = (req.params?.arguments as Record<string, unknown>) ?? {};
      const tool = TOOL_BY_NAME.get(name);
      if (!tool) return rpcResult(req.id, toolContent({ error: `알 수 없는 툴: ${name}` }, true));
      if (tool.access === 'write' && access !== 'write') {
        return rpcResult(
          req.id,
          toolContent({ error: '쓰기 권한이 필요합니다 (write 토큰).' }, true),
        );
      }
      try {
        const out = await tool.handler(args, actor);
        return rpcResult(req.id, toolContent(out));
      } catch (err) {
        return rpcResult(
          req.id,
          toolContent({ error: err instanceof Error ? err.message : String(err) }, true),
        );
      }
    }
    default:
      return rpcError(req.id, -32601, `지원하지 않는 메서드: ${req.method}`);
  }
}

export async function POST(request: NextRequest) {
  const access = authLevel(request);
  if (access === 'none') {
    return NextResponse.json(
      rpcError(null, -32001, '인증 실패: Bearer read/write 토큰이 필요합니다.'),
      { status: 401 },
    );
  }
  const actor = access === 'write' ? 'mcp:write' : 'mcp:read';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'JSON 파싱 오류'), { status: 400 });
  }

  // 배치 지원.
  if (Array.isArray(body)) {
    const responses = [];
    for (const item of body) {
      const r = item as RpcRequest;
      if (r.id === undefined || r.id === null) {
        // notification — 응답 없음
        continue;
      }
      responses.push(await handleRpc(r, access, actor));
    }
    if (responses.length === 0) return new NextResponse(null, { status: 202 });
    return NextResponse.json(responses);
  }

  const req = body as RpcRequest;
  if (req.id === undefined || req.id === null) {
    // notification (예: notifications/initialized) — 202 no content
    return new NextResponse(null, { status: 202 });
  }
  const res = await handleRpc(req, access, actor);
  return NextResponse.json(res);
}

/** 간단 헬스체크·설명 (GET). */
export async function GET() {
  return NextResponse.json({
    server: 'ai-tools-crm MCP',
    protocol: PROTOCOL_VERSION,
    transport: 'streamable-http (JSON-RPC 2.0 over POST)',
    auth: 'Authorization: Bearer <AI_TOOLS_MCP_READ_TOKEN | AI_TOOLS_MCP_WRITE_TOKEN>',
    tools: TOOLS.map((t) => ({ name: t.name, access: t.access })),
  });
}
