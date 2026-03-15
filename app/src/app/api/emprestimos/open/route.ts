import { NextResponse } from 'next/server';

import { listOpenEmprestimosForDevolucao } from '@/features/emprestimos/server/devolucoes-open-selector-api';

type OpenEmprestimosSearchParams = {
  page: number;
  search?: string;
};

function parseSearchParams(url: string): OpenEmprestimosSearchParams {
  const { searchParams } = new URL(url);
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawSearch = searchParams.get('search')?.trim();
  return { page, search: rawSearch || undefined };
}

export async function GET(request: Request): Promise<Response> {
  const { page, search } = parseSearchParams(request.url);

  try {
    const payload = await listOpenEmprestimosForDevolucao(page, search);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: 'Nao foi possivel carregar emprestimos em aberto' },
      { status: 500 },
    );
  }
}
