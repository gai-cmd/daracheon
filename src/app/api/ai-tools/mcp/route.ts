import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  listTools,
  getTool,
  createTool,
  updateTool,
  addPayment,
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
      },
    },
    handler: async (args, actor) => {
      const tool = await createTool({
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
      },
    },
    handler: async (args, actor) => {
      const id = args.id as string;
      const patch: Record<string, unknown> = {};
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
