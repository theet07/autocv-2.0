# 🚀 AutoCV 2.0 — Estúdio ATS Multi-Template, CRM de Vagas & Disparador Inteligente

O **AutoCV 2.0** é uma plataforma completa e de código aberto projetada para automatizar, profissionalizar e acelerar a busca por empregos na área de tecnologia e suporte. 

Com ele, qualquer pessoa pode cadastrar seu perfil, adaptar seu currículo aos robôs de triagem (**ATS - Applicant Tracking Systems**), gerar PDFs elegantes com layouts executivos e gerenciar candidaturas em um CRM visual estilo Kanban.

---

## ⚡ Início Rápido (Menos de 2 minutos)

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (versão 18 ou superior).

---

### Opção 1: Inicialização em 1 Clique (Windows)
Basta dar dois cliques no arquivo:
```cmd
iniciar-autocv-2.0.bat
```
> O script instala automaticamente as dependências se necessário, compila a interface e abre a aplicação no seu navegador em **`http://localhost:3002`**.

---

### Opção 2: Pelo Terminal (Linux / macOS / Windows)

1. Clone o repositório ou baixe o código:
   ```bash
   git clone https://github.com/theet07/autocv-2.0.git
   cd autocv-2.0
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile a interface web:
   ```bash
   npm run build
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```

5. Acesse no navegador:
   👉 **`http://localhost:3002`**

---

## 🛠️ Como Personalizar com seus Dados (Passo a Passo)

### 1. Preencha seu Perfil (Aba "Perfil")
- Acesse a aba **Perfil** na barra lateral.
- Insira suas informações de contato: **Nome Completo**, **E-mail**, **Telefone/WhatsApp**, **Cidade**, **LinkedIn** e **GitHub**.
- Preencha seu resumo profissional, experiências anteriores, formação acadêmica, projetos e certificações.
- Os dados ficam salvos localmente no arquivo `data/profile.json`.

### 2. Cadastre Vagas de Interesse (Aba "Vagas CRM")
- Você pode cadastrar vagas manualmente ou usar a ferramenta de **Captura Rápida**: cole o texto bruto do anúncio da vaga (copiado do LinkedIn, Gupy, WhatsApp, etc.) e o sistema extrai automaticamente o cargo, a empresa, a modalidade e as principais tecnologias.
- Acompanhe o ciclo de cada vaga pelo **Pipeline Kanban** (*Pendente*, *Simulado*, *Enviado*, *Follow-up*, *Entrevista & Proposta*).

### 3. Adapte seu Currículo para a Vaga (Aba "Adaptação ATS")
- Selecione uma vaga e veja o **Match ATS % em tempo real**. O sistema analisa mais de 180 termos técnicos do mercado brasileiro (como Active Directory, VPN, SQL, Linux, Redes, etc.) e pontua seu currículo de 0 a 100.
- Gere o currículo ideal com adaptação de tópicos e palavras-chave.
- Escolha entre **3 Layouts ATS-Safe** (*Executivo Clássico*, *Tech & Engenharia*, *Compacto 1 Página*) e **4 Paletas de Cores** (*Marinho*, *Grafite*, *Esmeralda*, *Cobalto*).
- Os PDFs gerados contam com **links reais e clicáveis** para seu e-mail, telefone, WhatsApp, LinkedIn e GitHub.
- Obtenha um **Kit de Comunicação Completo**:
  - Mensagem pronta e educada para enviar no WhatsApp do recrutador.
  - Nota personalizada para conectar com o gestor no LinkedIn.
  - E-mail de follow-up pós-candidatura.
  - Roteiro com as perguntas mais prováveis de entrevista técnica e estratégias recomendadas de resposta.

### 4. Envio e Simulação (Aba "Disparo")
- **Modo Simulação (Ativado por padrão):** Permite simular o envio das candidaturas e gerar os PDFs sem disparar e-mails de verdade. Ideal para testar e revisar tudo antes.
- **Disparo Real via SMTP:** Caso deseje automatizar o envio via e-mail, configure suas credenciais na aba **Configurações** (por exemplo, Gmail com Senha de Aplicativo). O sistema conta com intervalos anti-spam aleatórios entre os envios e trava para evitar envios duplicados para a mesma vaga.

---

## 📁 Estrutura de Pastas

```text
autocv-2.0/
├── data/                    # Dados locais em formato JSON
│   ├── profile.json         # Seus dados de perfil, formação e experiências
│   ├── profile.example.json # Modelo de referência para restauração
│   ├── targets.json         # Suas vagas cadastradas no CRM
│   ├── settings.json        # Configurações de e-mail e templates de mensagem
│   └── history.json         # Histórico de envios realizados
├── output/                  # Onde os PDFs gerados são salvos automaticamente
├── server/                  # Backend Node.js / Express
│   ├── atsDictionary.js     # Dicionário de termos e sinônimos ATS
│   ├── tailorEngine.js      # Motor de adaptação inteligente de currículo
│   ├── pdfGenerator.js      # Gerador de PDFs vetoriais com PDFKit
│   ├── emailSender.js       # Disparador com Nodemailer (HTML + Texto Puro)
│   ├── jobParser.js         # Extrator inteligente de anúncios brutos
│   └── server.js            # API REST e endpoints da aplicação
├── src/                     # Interface Web (React 19 + Tailwind CSS)
│   ├── components/          # Painéis, Modais, CRM e Estúdio de PDF
│   └── constants/           # Pilares profissionais e metadados
├── tests/                   # Suíte de testes automatizados
├── iniciar-autocv-2.0.bat   # Launcher automático para Windows
└── package.json             # Dependências e scripts do projeto
```

---

## 🧪 Testes Automatizados

Para rodar a bateria de testes unitários e de integração:
```bash
npm test
```

---

## 🔒 Privacidade e Segurança

- **100% Local:** Todo o processamento de texto, cálculo de pontuação ATS e geração de PDFs ocorre localmente no seu computador.
- **Nenhum Dado Compartilhado:** Suas informações pessoais, currículos e senhas nunca saem da sua máquina para servidores de terceiros.
- **Proteção de Credenciais:** As senhas SMTP são tratadas com segurança e nunca são expostas em logs ou exportações de backup.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Sinta-se livre para usar, modificar e compartilhar com quem também estiver em busca de novas oportunidades profissionais!
