-- INK.system — Gestão de Estúdio de Tatuagem — Schema

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_nascimento date,
  endereco text,
  email text,
  celular text,
  ocupacao text,
  indicacao text,
  termo_aceito boolean default false,
  observacoes text,
  created_at timestamptz default now()
);

create table anamnese (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  tratamentos_anteriores boolean default false,
  tratamentos_obs text,
  doencas boolean default false,
  doencas_obs text,
  herpes boolean default false,
  alergias boolean default false,
  alergias_obs text,
  medicamento_continuo boolean default false,
  medicamento_obs text,
  fuma boolean default false,
  bebe boolean default false,
  gravida boolean default false,
  isotretinoina boolean default false,
  historico_queloide boolean default false
);

create table sessoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  numero_sessao integer not null default 1,
  data date,
  horario time,
  valor numeric(10,2),
  status text not null default 'agendada'
    check (status in ('agendada', 'realizada', 'remarcada', 'faltou')),
  observacoes text,
  created_at timestamptz default now()
);

create table fotos_sessao (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid references sessoes(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- Projetos de tatuagem (o que será feito para cada cliente)
create table tatuagens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  ideia_referencia text,
  estilo text,
  local_corpo text,
  tamanho_cm numeric,
  orcamento numeric(10,2),
  cobertura boolean default false,
  created_at timestamptz default now()
);

-- Orçamentos (propostas por cliente)
create table orcamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  descricao text,
  valor numeric(10,2),
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'recusado')),
  validade date,
  observacoes text,
  created_at timestamptz default now()
);

-- Financeiro (livro-caixa: entradas e saídas)
create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text,
  categoria text,
  valor numeric(10,2) not null default 0,
  data date not null default current_date,
  pago boolean not null default true,
  created_at timestamptz default now()
);

-- Estoque de materiais
create table estoque (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  quantidade numeric not null default 0,
  unidade text default 'un',
  minimo numeric not null default 0,
  created_at timestamptz default now()
);

create table configuracoes (
  id integer primary key default 1,
  mensagem_whatsapp_padrao text
);

insert into configuracoes (id, mensagem_whatsapp_padrao)
values (1, 'Oi {nome}! Sua sessão está agendada para {data} às {horario}. Confirma presença? 😊')
on conflict do nothing;
