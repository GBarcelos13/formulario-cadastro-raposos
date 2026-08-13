-- Sobe o limite por arquivo de 5MB para 20MB (PDFs escaneados de histórico
-- escolar / documentos multi-página costumam passar de 5MB).
update storage.buckets
set file_size_limit = 20971520 -- 20MB
where id = 'documentos-matricula';
