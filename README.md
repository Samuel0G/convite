# Combinado

Convites românticos com links curtos e respostas sem login.

## Banco de dados

O projeto usa Upstash Redis pela API REST. Configure estas variáveis no projeto da Vercel:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Depois de adicionar as variáveis, faça um novo deploy. Os convites serão acessíveis por links no formato `/convite/767aft`.
