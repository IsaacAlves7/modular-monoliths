![Best_Frontend_Frameworks_Compatible_With_Shopify_Stores_2_163d8be7-4260-4729-9769-023ff4eb09c0](https://github.com/user-attachments/assets/bdb7008d-06ad-4572-8237-77b8c7d93db5)

Exemplo: Shopify Tech Stack and Tools (System Design)

<table>
	<tr>
		<td><img src="https://github.com/user-attachments/assets/8d6f43c0-c682-451e-972d-8b310e93a4fa" height="677"/></td>
		<td><img src="https://github.com/user-attachments/assets/aaddc684-ad5a-4c27-8ed5-2cc26df77b0e" height="677"></td>
	</tr>
</table>

Shopify é uma plataforma de comércio multicanal para pequenas e médias empresas. Ele permite que os comerciantes criem uma loja e vendam produtos onde quiserem.

Aqui está o Shopify Tech Stack, que abastece mais de 600.000 comerciantes e atende a 80.000 solicitações por segundo durante o pico de tráfego.

- Linguagens de Programação e UI: Eles usam Ruby, Typescript, Lua e React
- Backend e Servidores: Eles usam Ruby on Rails, Nginx, OpenResty e GraphQL.
- Dados: Eles usam MySQL, Redis e Memcached.
- DevOps: Eles usam GitHub, Docker, Kubernetes, GKE, BuildKite e ShipIt. O ShipIt também foi tornado open source.

Esses números não são anomalias. São metas contínuas que o Shopify busca alcançar. Por trás dessa escala há uma pilha que parece enganosamente simples vista de fora: Ruby on Rails, React, MySQL e Kafka.

Mas essa simplicidade esconde decisões arquitetônicas aguçadas, anos de refatoração e milhares de trade-offs deliberados.

Nesta newsletter, mapeamos a pilha tecnológica que alimenta o Shopify a partir de:

- o monólito modular que ainda comanda o negócio,
- para os pods que isolam domínios de falha,
- Aos pipelines de implantação que enviam centenas de mudanças por dia.
- Ele cobre as ferramentas, linguagens de programação e padrões que o Shopify usa para se manter rápido, resiliente e amigável para desenvolvedores em uma escala incrível.

Um enorme obrigado à equipe de engenharia de classe mundial da Shopify por compartilhar seus insights e colaborar conosco nessa profunda exploração técnica.

> Observação: Este artigo foi escrito em colaboração com a equipe de engenharia da Shopify. Agradecimentos especiais à equipe de engenharia da Shopify por compartilhar conosco detalhes sobre sua pilha de tecnologia e também por revisar o artigo final antes da publicação. Todos os créditos pelos detalhes técnicos e diagramas compartilhados neste artigo vão para a Equipe de Engenharia da Shopify.

A Shopify lida com uma escala que quebraria a maioria dos sistemas. Em um único dia (Black Friday de 2024), a plataforma processou 173 bilhões de solicitações, atingiu o pico de 284 milhões de solicitações por minuto e enviou 12 terabytes de tráfego a cada minuto através de sua borda.

Esses números não são anomalias. São metas sustentadas que a Shopify se esforça para atingir. Por trás dessa escala, há uma pilha que parece enganosamente simples vista de fora: Ruby on Rails, React, MySQL e Kafka.

Mas essa simplicidade esconde decisões arquitetônicas precisas, anos de refatoração e milhares de compensações deliberadas.

Neste artigo, mapeamos a pilha de tecnologia que impulsiona a Shopify, desde o monólito modular que ainda administra o negócio, passando pelos pods que isolam domínios de falha, até os pipelines de implantação que enviam centenas de alterações por dia. Abordamos as ferramentas, linguagens de programação e padrões que a Shopify utiliza para se manter rápida, resiliente e amigável ao desenvolvedor em uma escala incrível.

O **backend da Shopify** roda em Ruby on Rails. A base de código original, escrita no início dos anos 2000, ainda constitui o coração do sistema. O Rails oferece desenvolvimento rápido, convenção em vez de configuração e padrões robustos para aplicações web baseadas em banco de dados. A Shopify também utiliza Rust como linguagem de programação de sistemas.

Enquanto a maioria das startups eventualmente reescreve seus frameworks iniciais, a Shopify se esforçou para ajudar a garantir que Ruby e Rails sejam ferramentas centenárias que continuarão a merecer estar em sua cadeia de ferramentas de escolha. Em vez de migrar para outro framework, a Shopify o levou mais longe. Eles investiram em:

- **YJIT**, um compilador Just-in-Time para Ruby construído em Rust que melhora o desempenho em tempo de execução sem alterar a ergonomia do desenvolvedor.

- **Sorbet**, um verificador de tipos estáticos desenvolvido especificamente para Ruby. A Shopify contribuiu fortemente para o Sorbet e o tornou uma parte de primeira classe da pilha.

- **Rails Engines**, um recurso integrado do Rails reaproveitado como um mecanismo de modularidade. Cada mecanismo se comporta como uma miniaplicação, permitindo isolamento, propriedade e eventual extração, se necessário.

O resultado é uma das maiores e mais antigas aplicações Rails em produção (código legado), devido o Ruby ser uma linguagem pouco usada em 2025, podendo ser previsto uma descontinuação até 2030.

<img height="277" align="right" src="https://github.com/user-attachments/assets/be23a748-77a9-4183-8ed2-3ba329c21d41" />

**Estratégia de Modularização (Modularization Strategy)**: O Shopify opera um monólito modular. Essa frase é muito usada, mas no caso do Shopify, significa o seguinte: toda a base de código reside em um repositório, é executada em um único processo, mas é dividida em componentes implantáveis ​​de forma independente, com limites rígidos.

Cada componente define uma interface pública, com contratos aplicados via Sorbet.

Essas interfaces não são opcionais. Elas são uma forma de evitar acoplamentos rígidos, permitir refatorações seguras e fazer com que o sistema pareça menor do que realmente é. Os desenvolvedores não precisam entender milhões de linhas de código. Eles precisam conhecer os contratos dos quais seu componente depende e confiar que esses contratos serão cumpridos.

Para gerenciar a complexidade, os componentes são organizados em camadas lógicas:

- **Plataforma**: Serviços básicos como identidade, estado da loja e abstrações de banco de dados;

- **Suporte**: Domínios de negócios como estoque, remessa ou merchandising;

- **Frontend-facing**: Interfaces externas como a loja online ou APIs GraphQL.

<img height="277" align="right" src="https://github.com/user-attachments/assets/7eadc6f8-e482-4124-90fc-f69cfefd2c9d" />

Essa estrutura em camadas evita dependências cíclicas e incentiva um fluxo limpo entre domínios.

Para oferecer suporte a isso em escala, a Shopify mantém um sistema abrangente de ferramentas de análise estática, painéis de monitoramento de exceções e métricas diferenciadas de aplicativos/negócios para monitorar a integridade dos componentes em toda a empresa.

Essa estrutura modular não facilita o desenvolvimento. Ela introduz limites, que podem parecer atritos. No entanto, mantém as equipes alinhadas, reduz o acoplamento acidental e permite que a Shopify evolua sem perder o controle de sua essência.

O **frontend da Shopify** passou por diversas mudanças arquitetônicas, cada uma refletindo mudanças no ecossistema web mais amplo e lições aprendidas com a escalabilidade. Nos primeiros dias, utilizava padrões de fábrica (standard patterns): modelos HTML renderizados pelo servidor, aprimorados com jQuery e prototype.js. À medida que a complexidade do frontend aumentava, a Shopify desenvolveu o Batman.js, seu framework de aplicativo de página única (SPA). Ele oferecia reatividade e roteamento, mas, como a maioria dos frameworks internos, apresentava sobrecarga de manutenção a longo prazo.

Com o tempo, a Shopify voltou a padrões mais simples: HTML renderizado estaticamente e JavaScript puro. No entanto, isso também tinha limites. Com a maturidade do ecossistema mais amplo, principalmente em torno do React e do TypeScript, a equipe deu um passo à frente.

Hoje, a interface do Shopify Admin é executada em React, React Router da Remix, escrita em TypeScript e conduzida inteiramente por GraphQL. Ela segue uma separação rigorosa: sem lógica de negócios no cliente, sem estado compartilhado entre as visualizações. O Admin é um dos maiores aplicativos da Shopify, desenvolvido no Remix e que se comporta como um cliente GraphQL sem estado. Cada página busca exatamente os dados de que precisa, quando precisa.

Essa disciplina impõe consistência entre plataformas. Aplicativos móveis e telas de administração web falam a mesma linguagem (GraphQL), reduzindo duplicações e desalinhamentos entre as superfícies.

O **desenvolvimento mobile** na Shopify segue uma filosofia semelhante: reutilizar onde possível, especializar onde necessário. Todos os principais aplicativos agora rodam em React Native. O objetivo de usar uma única estrutura é compartilhar código, reduzir a dispersão entre plataformas e melhorar a velocidade do desenvolvedor em Android e iOS.

Bibliotecas compartilhadas potencializam preocupações comuns, como autenticação, rastreamento de erros e monitoramento de desempenho. Quando os aplicativos precisam migrar para o nativo para acesso à câmera, hardware de pagamento ou tarefas em segundo plano de longa duração, eles o fazem por meio de módulos nativos bem definidos.

As equipes da Shopify também contribuem diretamente para projetos do ecossistema React Native, como o Mobile Bridge (para permitir que a web acione elementos nativos da interface do usuário), o Skia (para renderização 2D rápida), o WebGPU (que habilita APIs de GPU modernas e computação de GPU de uso geral para IA/ML) e o Reanimated (para animações de alto desempenho). Em alguns casos, os engenheiros da Shopify co-capitam lançamentos do React Native.

As escolhas de linguagens de programação da Shopify refletem seu compromisso com a produtividade do desenvolvedor e a resiliência operacional.

- O **Ruby** continua sendo a espinha dorsal do backend da Shopify. Ele alimenta o monolito, os mecanismos e a maioria dos serviços internos.

- O **Sorbet**, um verificador de tipos estático para Ruby, preenche a lacuna de segurança tradicionalmente deixada em aberto em sistemas com tipagem dinâmica. Ele permite feedback antecipado sobre violações de interface e limites de contrato.

- O **TypeScript** é uma linguagem de primeira classe no frontend. Em conjunto com o React, ele fornece comportamento previsível na web e em plataformas móveis.

- O **JavaScript** ainda aparece em bibliotecas compartilhadas e ativos mais antigos, mas a maioria dos desenvolvimentos modernos favorece o TypeScript por suas ferramentas e clareza.

- O **Lua** é usado para scripts personalizados dentro do OpenResty, o servidor HTTP de camada de borda da Shopify construído em Nginx. Isso permite balanceamento de carga programável e de alto desempenho.

- O **GraphQL** é servido pelo backend do Ruby e usado em todos os principais clientes, como aplicativos web, móveis e de terceiros.

- O **YAML** do Kubernetes define implantações de infraestrutura, configurações de serviço e parâmetros de dimensionamento de ambiente.

- O **Remix** é um framework web full-stack usado em vários aspectos da plataforma — Interface Administrativa do Shopify, sites de marketing e Hydrogen, o framework de comércio headless do Shopify para a criação de vitrines personalizadas.

Ferramentas para Desenvolvedores e Contribuições de Código Aberto: Um grande monólito não se mantém saudável sem suporte. A Shopify desenvolveu um ecossistema de ferramentas internas e de código aberto para reforçar a estrutura, automatizar verificações de segurança e reduzir o trabalho operacional.

- O **Packwerk** reforça os limites de dependência entre os componentes do monólito. Ele sinaliza violações antecipadamente, antes que causem desvios na arquitetura.
- O **Tapioca** automatiza a geração de arquivos Sorbet RBI (Ruby Interface), mantendo as definições de tipo estáticas sincronizadas com o código real.
- O **Bootsnap** melhora os tempos de inicialização de aplicativos Ruby, armazenando em cache cálculos caros, como análise sintática de YAML e carregamento de gems.

As Tarefas de Manutenção padronizam a execução de tarefas em segundo plano. Elas tornam as tarefas recorrentes idempotentes, seguras para serem executadas novamente e fáceis de observar.

- O **Toxiproxy** simula condições de rede não confiáveis, como latência, pacotes descartados ou timeouts, permitindo que os serviços testem seu comportamento sob estresse.

- O **TruffleRuby** é uma implementação Ruby de alto desempenho desenvolvida pela Oracle. A Shopify contribui para isso como parte de seu esforço mais amplo para levar Ruby ainda mais longe.

- O **Semian** é uma biblioteca de disjuntores para Ruby, protegendo recursos críticos como Redis ou MySQL de falhas em cascata durante interrupções parciais.

- O **Roast** é um framework orientado a convenções para a criação de fluxos de trabalho de IA estruturados, mantido e usado internamente pela equipe de Engenharia Aumentada da Shopify.

Uma lista muito mais completa de softwares de código aberto suportados pela Shopify também está disponível aqui.

Bancos de Dados, Cache e Filas (Databases, Caching, and Queuing), há duas categorias principais aqui:

<img height="277" align="right" src="https://github.com/user-attachments/assets/430aa9e8-21d7-452d-b4d0-7540548db0b0" />

Banco de Dados Principal: MySQL - A Shopify usa o MySQL como seu principal banco de dados relacional, e tem feito isso desde os primeiros dias da plataforma. No entanto, com o aumento do volume de comerciantes e da taxa de transferência transacional, os limites de uma única instância tornaram-se inevitáveis.

Em 2014, a Shopify introduziu o sharding. Cada shard contém uma partição dos dados gerais, e os comerciantes são distribuídos entre esses shards com base em regras determinísticas. Isso funciona bem no comércio, onde o isolamento de inquilinos é natural. Os pedidos de um comerciante não precisam consultar o estoque de outro comerciante.

Com o tempo, a Shopify substituiu o modelo de shard plano por Pods. Um pod é uma fatia totalmente isolada da Shopify, contendo sua própria instância MySQL, nó Redis e cluster Memcached. Cada pod pode ser executado de forma independente e cada um pode ser implantado em uma região geográfica separada.

Este modelo resolve dois problemas:

- Ele remove pontos únicos de falha. Um problema em um pod não se espalha para toda a frota.

- Ele permite que a Shopify escale horizontalmente adicionando mais pods em vez de escalar verticalmente o banco de dados.

Ao levar o isolamento para o nível da infraestrutura, a Shopify contém domínios de falha e simplifica a recuperação operacional.

**Cache e Filas** (Caching & Queues): A Shopify conta com dois sistemas principais para cache e trabalho assíncrono: Memcached e Redis.

- O Memcached gerencia o cache de chave-valor. Ele acelera leituras acessadas com frequência, como metadados de produtos ou informações de sessão do usuário, sem sobrecarregar o banco de dados.

- O Redis potencializa filas e processamento de tarefas em segundo plano. Ele suporta os fluxos de trabalho assíncronos da Shopify: entrega de webhook, envios de e-mail, novas tentativas de pagamento e sincronizações de inventário.

Mas o Redis nem sempre teve um escopo claro. Em determinado momento, todos os fragmentos do banco de dados compartilhavam uma única instância do Redis. Uma falha nesse Redis central derrubou toda a plataforma. Internamente, o incidente ainda é conhecido como "Redismageddon".

A lição que a Shopify tirou desse incidente foi clara: nunca centralize um sistema que deveria isolar o trabalho. Posteriormente, o Redis foi reestruturado para corresponder ao modelo de pod, dando a cada pod seu próprio nó Redis. Desde então, as interrupções foram localizadas e a plataforma evitou falhas globais vinculadas à infraestrutura compartilhada.

**Mensagens e Comunicação entre Serviços** (Messaging and Communication Between Services): Existem duas categorias principais:

Eventos e Streaming (Eventing & Streaming): A Shopify utiliza o Kafka como a espinha dorsal para mensagens e distribuição de eventos. Ele forma a espinha dorsal da camada de comunicação interna da plataforma, desacoplando produtores de consumidores, armazenando tráfego de alto volume e suportando pipelines em tempo real que alimentam fluxos de trabalho de pesquisa, análises e negócios.

No pico, o Kafka na Shopify processou 66 milhões de mensagens por segundo, um nível de transferência que poucos sistemas encontram fora de plataformas financeiras ou de streaming de grande escala.

Essa camada de mensagens atende a vários casos de uso:

Emissão de eventos de domínio quando objetos principais são alterados (por exemplo, pedido criado, produto atualizado)

Impulsionando fluxos de trabalho de inferência de ML com atualizações quase em tempo real

Fortalecendo a indexação de pesquisa, o rastreamento de estoque e as notificações de clientes

Ao confiar no Kafka, a Shopify evita o acoplamento rígido entre serviços. Os produtores não esperam pelos consumidores. Os consumidores processam em seu próprio ritmo. E quando algo dá errado, como uma falha no serviço downstream, o fluxo de eventos retém os dados até que o sistema se recupere.

Essa é uma maneira prática de criar resiliência em uma plataforma em rápida evolução.

**Interfaces de API** (API Interfaces): Para interações síncronas, os serviços da Shopify se comunicam via HTTP, usando uma combinação de REST e GraphQL.

- As APIs REST ainda impulsionam grande parte da comunicação interna, especialmente entre serviços mais antigos e ferramentas de suporte.

- O GraphQL é a interface preferida para clientes front-end e mobile. Ela permite consultas de dados precisas, reduz o overfetch e se alinha à filosofia da Shopify de empurrar a complexidade para o servidor.

No entanto, à medida que o número de serviços aumenta, esse modelo começa a se desgastar. Chamadas síncronas introduzem acoplamento rígido e caminhos de falha ocultos, especialmente quando um serviço depende transitivamente de outros cinco. Para resolver isso, a Shopify está explorando ativamente a padronização de RPC e arquiteturas de malha de serviço. O objetivo é construir uma camada de comunicação que seja:

- Observavelmente confiável
- Fácil de entender
- Padronizada em todos os ambientes

A infraestrutura de ML na Shopify pode ser dividida em duas partes principais:

**Busca em Tempo Real com Embeddings** (Real-Time Search with Embeddings): A busca na vitrine da Shopify não depende da correspondência tradicional de palavras-chave. Ela utiliza busca semântica alimentada por embeddings de texto e imagem: representações vetoriais de metadados de produtos e recursos visuais que permitem resultados de busca mais relevantes e contextuais.

<img width="1100" height="563" alt="image" src="https://github.com/user-attachments/assets/6191a8e3-a4fd-464f-b05e-18df85db9fb6" />

Este sistema opera em escala de produção. A Shopify processa cerca de 2.500 incorporações por segundo, o que equivale a mais de 216 milhões por dia. Essas incorporações abrangem diversas modalidades, incluindo:

- Títulos e descrições de produtos (texto)
- Imagens e miniaturas (conteúdo visual)

Cada incorporação é gerada quase em tempo real e publicada imediatamente para consumidores finais, que as utilizam para atualizar índices de busca e personalizar resultados.

<img height="377" align="right" src="https://github.com/user-attachments/assets/db1fe5d2-61c7-41bf-9a4e-cbe3845983ac" />

O sistema de incorporação também realiza desduplicação inteligente. Por exemplo, imagens visualmente idênticas são agrupadas para evitar inferências desnecessárias. Essa otimização, por si só, reduziu o uso de memória para incorporação de imagens de 104 GB para menos de 40 GB, liberando recursos de GPU e reduzindo custos em todo o pipeline.

**Data Pipeline Infrastructure**: Internamente, a Shopify executa seus pipelines de ML no Apache Beam, executados por meio do Google Cloud Dataflow. Esta configuração suporta:

- Inferência de streaming em escala.
- Aceleração de GPU por meio de componentes personalizados do ModelHandler.
- Paralelismo eficiente de pipeline usando pools de threads otimizados.

Os trabalhos de inferência são estruturados para processar embeddings da forma mais rápida e econômica possível. O pipeline usa um número baixo de threads simultâneas (reduzido de 192 para 64) para evitar contenção de memória, garantindo que o desempenho da inferência permaneça previsível sob carga.

A Shopify equilibra latência, taxa de transferência e custo de infraestrutura. A configuração atual busca esse equilíbrio com cuidado:

- Os embeddings são gerados com rapidez suficiente para atualizações quase em tempo real.
- A memória da GPU é usada com eficiência.
- A computação redundante é evitada por meio de cache inteligente e pré-filtragem.

Para análises offline, a Shopify armazena embeddings no BigQuery, permitindo consultas em larga escala, análise de tendências e avaliação de desempenho de modelos sem afetar os sistemas ativos.

**DevOps, CI/CD & Deployment**: Esta área pode ser dividida nas seguintes partes:

**Implantação Baseada em Kubernetes**: A Shopify implanta a infraestrutura usando o Kubernetes, executado no Google Kubernetes Engine (GKE). Cada pod da Shopify, uma unidade isolada contendo sua própria pilha MySQL, Redis e Memcached, é definido declarativamente por meio do YAML do Kubernetes, facilitando a replicação, a escalabilidade e o isolamento entre regiões.

O ambiente de execução utiliza contêineres Docker para empacotamento de aplicativos e o OpenResty, desenvolvido em Nginx com script Lua incorporado, para balanceamento de carga personalizado na borda. Esses scripts Lua fornecem à Shopify controle refinado sobre o comportamento do HTTP, permitindo decisões de roteamento inteligentes e otimizações de desempenho mais próximas do usuário.

Antes do Kubernetes, a implantação era gerenciada pelo Chef, uma ferramenta de gerenciamento de configuração mais adequada para ambientes estáticos. À medida que a plataforma evoluiu, também evoluiu a necessidade de uma arquitetura mais dinâmica, baseada em contêineres. A migração para o Kubernetes substituiu o provisionamento manual lento por uma infraestrutura como código rápida e declarativa.

**CI/CD Process**: O monolito da Shopify contém mais de 400.000 testes unitários, muitos dos quais exercem comportamentos ORM complexos. Executar todos eles em série levaria horas, talvez dias. Para se manter rápida, a Shopify conta com o Buildkite como seu orquestrador de CI. O Buildkite coordena as execuções de testes em centenas de workers paralelos, reduzindo o tempo de feedback e mantendo as compilações dentro de um intervalo de 15 a 20 minutos.

Após a conclusão da compilação, as ferramentas internas de implantação da Shopify assumem o controle e oferecem visibilidade sobre quem está implantando o quê e onde.

<img width="1024" height="720" alt="image" src="https://github.com/user-attachments/assets/069c6c0b-0862-4004-88f1-f8aa0e08d45f" />

As implantações não vão direto para a produção. Em vez disso, o ShipIt usa uma Fila de Mesclagem para controlar a implementação. Em horários de pico, apenas 5 a 10 commits são mesclados e implementados por vez. Essa limitação facilita o rastreamento de problemas e minimiza o raio de ação quando algo quebra.

Em especial, o Shopify não depende de ambientes de preparação ou implementações canárias. Em vez disso, eles usam sinalizadores de recursos para controlar a exposição e mecanismos de reversão rápida para desfazer alterações incorretas rapidamente. Se um recurso apresentar mau funcionamento, ele pode ser desativado sem reimplantar o código.

**Observabilidade, Confiabilidade e Segurança**: Esta área pode ser dividida em várias partes, como:

**Infraestrutura de Observabilidade**: A Shopify adota uma abordagem estruturada e com foco em serviços para a observabilidade. No centro disso está o ServicesDB, um registro de serviços interno que rastreia:

- Propriedade do serviço e responsabilidade da equipe
- Logs de tempo de execução e relatórios de exceções
- Tempo de atividade e integridade operacional
- Versões de gems e status de patches de segurança

**Gráficos de dependência entre aplicativos**: O ServicesDB cataloga metadados e aplica boas práticas. Quando um serviço sai da conformidade (por exemplo, devido a gems desatualizadas ou logs ausentes), ele abre automaticamente problemas no GitHub e marca a equipe responsável. Isso cria uma pressão contínua para manter a qualidade do serviço em todos os níveis.

<img width="1024" height="543" alt="image" src="https://github.com/user-attachments/assets/bbf8358f-3fa3-49b4-9f81-95236c0173a7" />

A resposta a incidentes não fica isolada em uma única equipe de operações. A Shopify utiliza um modelo de escalonamento lateral: todos os engenheiros compartilham a responsabilidade pelo tempo de atividade, e o escalonamento ocorre com base na expertise do domínio, não no cargo. Isso incentiva a propriedade compartilhada e reduz os atrasos na transferência de tarefas durante interrupções críticas.

Para tolerância a falhas, a Shopify conta com duas ferramentas principais:

- O **Semian**, uma biblioteca de disjuntores para Ruby, ajuda a proteger serviços essenciais como Redis e MySQL de falhas em cascata durante a degradação.

- O **Toxiproxy** permite que os engenheiros simulem condições adversas de rede (picos de latência, pacotes perdidos, oscilações de serviço) antes que esses problemas apareçam na produção. Ele é usado em ambientes de teste para validar suposições de resiliência antecipadamente.

**Cadeia de Suprimentos e Segurança**: A segurança não é uma preocupação secundária na estrutura da Shopify, mas sim parte do investimento no ecossistema. Como a empresa depende fortemente do Ruby, também trabalha ativamente para proteger a comunidade Ruby em geral.

Os principais esforços incluem:

- Contribuições contínuas para o Bundler e o RubyGems, com foco na integridade das dependências e na segurança dos pacotes.
- Uma parceria estreita com a Ruby Central, a organização sem fins lucrativos que supervisiona a infraestrutura Ruby.
- Um compromisso de US$ 500.000 para financiar pesquisas acadêmicas e melhorias de desempenho no ecossistema Ruby.
- O objetivo não é apenas proteger a estrutura da Shopify, mas fortalecer a base compartilhada por milhares de desenvolvedores que dependem das mesmas ferramentas.

**Escala da Shopify**: A arquitetura da Shopify não é teórica. Ela foi construída para suportar a pressão do mundo real — vendas relâmpago da Black Friday, lançamentos de produtos de celebridades e atividade contínua de desenvolvedores em uma plataforma global. Esses números contextualizam essa escala.

- US$ 5 bilhões em Volume Bruto de Mercadorias (GMV) processados ​​na Black Friday.
- 284 milhões de solicitações por minuto na borda durante o pico de carga.
- 173 bilhões de solicitações totais processadas em um único período de 24 horas.
- 12 terabytes de saída de tráfego por minuto na rede de borda da Shopify.
- 45 milhões de consultas ao banco de dados por segundo no pico de carga de leitura.
- 7,6 milhões de gravações no banco de dados por segundo durante picos transacionais.
- 66 milhões de mensagens Kafka por segundo, sustentando os pipelines de eventos em tempo real da Shopify.
- Mais de 100.000 testes unitários executados em CI em cada compilação monolítica.
- 216 milhões de embeddings processados ​​por dia por meio de pipelines de inferência de ML.
- Taxa de sessão sem falhas >99,9% em aplicativos móveis React Native.
- 2,8 milhões de linhas de código Ruby no monolítico, com mais de 500.000 commits no controle de versão.
- Mais de 100 pods isolados, cada um contendo sua pilha (MySQL, Redis, Memcached).
- Mais de 100 aplicativos Rails internos, mantidos em conjunto com o monólito usando padrões compartilhados.
