-- FIADO CERTO v9: troca de aparelho na venda
-- Pode rodar inteiro. Não apaga nada.
alter table venda_parcelas add column if not exists tipo text not null default 'dinheiro';
alter table venda_parcelas add column if not exists produto_id uuid references produtos(id) on delete set null;

-- Conferência: deve mostrar as 2 colunas novas
select column_name from information_schema.columns
where table_name = 'venda_parcelas' and column_name in ('tipo','produto_id');
