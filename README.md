<a href="https://github.com/IsaacAlves7/modular-monoliths"><img width="1200" height="375" alt="1_CpCVN-lHtFKTuxF5dqEEzg" src="https://github.com/user-attachments/assets/fec24aaa-ca8d-42fd-ba24-1f7c6c1a3bea" /></a>

> Versículo chave: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos." - Provérbios 16:3

# 📦🏢 Modular monoliths
<img height="77" align="right" src="https://github.com/user-attachments/assets/73e73893-10e9-4d80-b818-f16309eb1e14" />

Um **monolítico modular** é uma arquitetura onde a aplicação é implantada como **um único sistema**, um único processo, um único deploy, mas *internamente é organizada em módulos fortemente isolados*, cada um com responsabilidades claras, contratos bem definidos e regras rígidas de dependência. Ele não é um “monólito bagunçado” melhorado, nem um microsserviço disfarçado; é uma tentativa deliberada de obter os benefícios conceituais dos microsserviços sem pagar, de início, o custo operacional deles.

A ideia central é que o acoplamento *não acontece no nível do deploy*, mas no nível do código e do domínio. Cada módulo representa um bounded context ou uma capacidade específica do sistema e controla completamente seu próprio modelo, regras e dados. Outros módulos não acessam suas estruturas internas diretamente; eles interagem por interfaces públicas, eventos ou APIs internas bem definidas. Mesmo estando no mesmo repositório e no mesmo binário, os módulos se comportam como se fossem sistemas separados do ponto de vista conceitual.

Isso muda profundamente os pontos de atenção em relação a um monólito tradicional. Em um monolito clássico, tudo pode chamar tudo, tabelas são compartilhadas, regras vazam entre camadas e o sistema cresce como um emaranhado difícil de entender e de evoluir. No monolítico modular, essas práticas são explicitamente proibidas ou fortemente desencorajadas. Dependências têm direção clara, ciclos são evitados, e o domínio não é contaminado por detalhes técnicos de outros módulos.

Outro aspecto importante é que um monolítico modular favorece *clareza semântica e evolução segura*. Como cada módulo tem fronteiras bem definidas, é possível mudar regras de negócio, pipelines de dados ou integrações sem quebrar o sistema inteiro. Testes também se tornam mais significativos, porque você consegue testar módulos de forma isolada, respeitando seus contratos, mesmo estando no mesmo processo.

No cenário em constante evolução do desenvolvimento de software, a escolha da arquitetura pode fazer ou fracassar um projeto.

Não é apenas uma decisão técnica, mas estratégica que determina a eficiência com que uma equipe pode construir, escalar e manter uma aplicação. Seja criando uma ferramenta simples ou um sistema complexo, a arquitetura escolhida prepara o terreno para tudo o que vem a seguir.

A arquitetura escolhida influencia não apenas como o software é construído, mas também como ele cresce e funciona ao longo do tempo. Um erro pode resultar em desempenho lento, bases de código confusas e equipes frustradas. Por outro lado, a escolha certa pode agilizar o desenvolvimento, suportar escalabilidade contínua e facilitar a manutenção.

Do ponto de vista prático, um monolítico modular costuma ser a escolha ideal quando o sistema ainda está crescendo, quando a equipe não é enorme ou quando os custos de microsserviços superariam os benefícios. Ele permite escalar o entendimento e a organização do código antes de escalar a infraestrutura. Quando chega o momento de extrair microsserviços, os módulos já existem conceitualmente; o que muda é apenas o modo de implantação.

> [!Note]
> Exploraremos os três principais estilos arquitetônicos: Monólito, Microserviços e Monólitos Modulares. Cada um oferece abordagens distintas para estruturar softwares, com benefícios e desafios únicos. Examinaremos os pontos fortes e fracos de cada abordagem, desde a facilidade de um monólito até a resiliência dos microserviços e o design equilibrado de um monólito modular. Vamos analisar cenários em que mudar de uma arquitetura para outra faz sentido, nos equipando com insights práticos para navegar por essas decisões críticas.

![66d12ddc-2abe-4a98-82d5-ee177e80487c_1470x1600](https://github.com/user-attachments/assets/701c4ceb-de64-40d3-acaa-b9ed3da50947)

Em essência, um monolítico modular é uma arquitetura que aposta na disciplina interna em vez da fragmentação externa. Ele reconhece que o maior problema dos sistemas grandes não é o fato de rodarem em um único processo, mas o fato de não terem limites claros. Quando esses limites existem, o monólito deixa de ser um problema e passa a ser uma base sólida para crescimento.

Modular monoliths mudam o *formato de implantação*, mas *não mudam o princípio arquitetural*. Eles não anulam a recomendação de desacoplar DDD e data-driven; eles apenas oferecem um *meio mais controlado* de fazer isso quando microsserviços seriam caros, prematuros ou desnecessários.

Em um monólito modular bem feito, você continua tendo *fronteiras rígidas*, só que internas. Os módulos não se conhecem por classes ou tabelas compartilhadas, mas por contratos explícitos, normalmente eventos internos, interfaces bem definidas ou APIs de aplicação. Isso permite separar um módulo claramente orientado a domínio — com agregados, invariantes e regras — de um módulo claramente orientado a dados — com ingestão, transformação, enriquecimento e projeções — mesmo estando no mesmo processo e no mesmo deploy.

O grande ganho aqui é **controle semântico com baixo custo operacional**. Você evita a complexidade de rede, observabilidade distribuída, versionamento de APIs externas e orquestração pesada, mas ainda preserva o isolamento conceitual. Para equipes pequenas ou sistemas em crescimento, isso é muitas vezes a melhor escolha: você mantém a disciplina arquitetural do desacoplamento sem pagar o preço total dos microsserviços.

Mas o ponto crítico é que um monólito modular só funciona se as fronteiras forem realmente respeitadas. Se módulos DDD começam a acessar diretamente estruturas internas do módulo data-driven, ou se pipelines começam a executar regras de negócio “porque está tudo no mesmo código”, o sistema degrada rapidamente para um monólito acoplado clássico. O erro mais comum é confundir “mesmo repositório” com “mesma responsabilidade”.

<img height="77" align="right" src="https://github.com/user-attachments/assets/3d3130fa-f4c5-4de8-b952-6c1433695696" />

Em um monólito modular saudável, o domínio continua sendo a fonte da verdade semântica. Ele publica eventos ou estados bem definidos. O módulo data-driven consome esses eventos, constrói visões, métricas, agregações e pipelines, e nunca devolve decisões de negócio de forma implícita. Quando existe feedback, ele ocorre por comandos explícitos ou sugestões, não por efeitos colaterais silenciosos.

Outro aspecto importante é a **evolução futura**. Modular monoliths são excelentes porque permitem uma transição natural para microsserviços quando e se isso fizer sentido. Um módulo data-driven que começa a sofrer com volume ou latência pode ser extraído quase intacto para um serviço Go, por exemplo. Um módulo DDD que exige maior isolamento ou times dedicados pode virar um serviço Ruby. Se as fronteiras foram bem desenhadas desde o início, essa extração é evolutiva, não traumática.

<img width="2934" height="1554" alt="modular_monolith" src="https://github.com/user-attachments/assets/7f422bdd-b0cc-4543-97ae-66374033a01f" />

Então, no contexto da sua pergunta, modular monoliths são frequentemente **a melhor resposta pragmática**: desacoplar DDD e data-driven conceitualmente, mantê-los separados estruturalmente, mas implantados juntos enquanto isso fizer sentido. Eles preservam clareza, reduzem risco e mantêm opções abertas. A arquitetura continua correta; apenas o custo operacional é adiado de forma inteligente.

Estrutura do projeto de monolítico modular:

```
src/
├── server.ts                  ← Entry point + graceful shutdown
├── app.ts                     ← Express app (monta os módulos)
├── config/index.ts            ← Zod env validation
├── prisma/
│   ├── schema.prisma          ← Users, Products, Orders, RefreshTokens
│   ├── client.ts              ← Singleton do PrismaClient
│   └── seed.ts                ← Dados iniciais
├── gateway/index.ts           ← API Gateway completo
├── shared/
│   ├── errors/                ← AppError, NotFoundError, etc.
│   ├── middleware/            ← Auth JWT, Zod validation, errorHandler
│   ├── types/                 ← Pagination, ApiResponse, JwtPayload
│   └── utils/logger.ts        ← Winston logger
└── modules/
    ├── users/                 ← Register, Login, Refresh Token, CRUD
    ├── products/              ← CRUD + ajuste de estoque
    └── orders/                ← Create, status machine, histórico
```

⚡ **API Gateway**: O gateway em `src/gateway/index.ts` é o ponto de entrada único e fornece:

- **Correlation ID** — cada request ganha um X-Correlation-ID para rastrear de ponta a ponta. 

- **Rate limiting** por módulo — `/api/users` tem limite mais restrito (anti-brute-force) que `/api/products`. 

- **Auth centralizada** — rotas marcadas como requireAuth: true são validadas no gateway antes de chegar no módulo. Métricas em memória — GET `/gateway/metrics` retorna total de requests, erros, taxa de erro e tempo médio por rota. 

- **Registry de rotas** — `GET /gateway/routes` lista todos os módulos registrados.

Running up:

```
cp .env.example .env
docker-compose up -d        # sobe o PostgreSQL

npm install
npm run db:migrate          # cria as tabelas
npm run db:seed             # popula dados iniciais
npm run dev                 # inicia em http://localhost:8080
```
