import { AppIcon } from "@/components/atoms/app-icon";
import { AppLink } from "@/components/atoms/app-link";
import { PageHeader } from "@/components/molecules/page-header";
import styles from "./index.module.css";

const faqSections = [
  {
    title: "Primeiros passos",
    questions: [
      {
        question: "Como altero meus dados e o link de agendamento?",
        answer: (
          <>
            Acesse <AppLink href="/perfil">Perfil</AppLink>, atualize seus
            dados, o fuso horário ou o endereço público e salve. O botão de
            copiar gera o link que você pode enviar aos clientes.
          </>
        ),
      },
      {
        question: "Como meus clientes fazem um agendamento?",
        answer: (
          <>
            Compartilhe o link disponível no seu perfil. O cliente escolhe uma
            data e um horário livre, informa os dados de contato e confirma a
            reserva sem precisar criar uma conta.
          </>
        ),
      },
    ],
  },
  {
    title: "Horários e disponibilidade",
    questions: [
      {
        question: "Como crio meus horários de atendimento?",
        answer: (
          <>
            Em <AppLink href="/inicio/horarios">Horários</AppLink>, selecione
            “Novo grupo”. Escolha os dias, o início, a duração e a quantidade de
            atendimentos. O sistema calcula o término automaticamente.
          </>
        ),
      },
      {
        question: "O que é um grupo de horários?",
        answer: (
          <>
            É uma rotina recorrente que reúne dias e faixas de atendimento. Por
            exemplo, você pode ter um grupo para dias úteis e outro para
            sábados. Somente grupos ativos oferecem horários aos clientes.
          </>
        ),
      },
      {
        question: "Por que um grupo apresenta conflito?",
        answer: (
          <>
            Dois grupos ativos não podem oferecer horários sobrepostos no mesmo
            dia. Desative ou edite um dos grupos antes de ativar o outro.
          </>
        ),
      },
      {
        question: "Como bloqueio ou reativo um horário específico?",
        answer: (
          <>
            Abra <AppLink href="/inicio/agendamentos">Agendamentos</AppLink>,
            escolha a data e selecione o horário. Horários livres podem ser
            inativados, e bloqueios futuros podem ser reativados.
          </>
        ),
      },
    ],
  },
  {
    title: "Agendamentos",
    questions: [
      {
        question: "Como consulto os agendamentos do dia?",
        answer: (
          <>
            O painel inicial mostra os atendimentos de hoje. Para consultar
            outra data, abra{" "}
            <AppLink href="/inicio/agendamentos">Agendamentos</AppLink> e
            selecione o dia no calendário.
          </>
        ),
      },
      {
        question: "O que significam Livre, Ocupado e Inativo?",
        answer: (
          <>
            Livre está disponível para clientes, Ocupado possui uma reserva e
            Inativo foi bloqueado e não aparece como opção no link público.
          </>
        ),
      },
      {
        question: "Como cancelo um atendimento?",
        answer: (
          <>
            Na agenda, abra um horário ocupado e escolha cancelar. Confirme a
            ação no modal. O cliente receberá um aviso e você poderá decidir se
            o horário volta a ficar livre ou permanece inativo.
          </>
        ),
      },
    ],
  },
];

export function HelpScreen() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Central de ajuda"
        title="Como podemos ajudar?"
        description="Encontre respostas rápidas sobre as principais funções da sua agenda."
      />

      <aside className={styles.guideCard} aria-labelledby="guide-title">
        <span className={styles.guideIcon}>
          <AppIcon name="info" size={24} />
        </span>
        <div>
          <h2 id="guide-title">Prefere ver o passo a passo?</h2>
          <p>
            Reabra o guia interativo e visite cada tela do painel novamente.
          </p>
        </div>
        <AppLink className={styles.guideButton} href="/inicio?guia=1">
          Rever guia <AppIcon name="chevron-right" size={18} />
        </AppLink>
      </aside>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <nav className={styles.sectionNav} aria-label="Seções da ajuda">
          <h2>Neste guia</h2>
          <ol>
            {faqSections.map((section, index) => (
              <li key={section.title}>
                <a href={`#faq-${index + 1}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-8">
          {faqSections.map((section, sectionIndex) => (
            <section
              aria-labelledby={`faq-${sectionIndex + 1}`}
              key={section.title}
            >
              <h2
                className={styles.sectionTitle}
                id={`faq-${sectionIndex + 1}`}
              >
                {section.title}
              </h2>
              <div className={styles.questions}>
                {section.questions.map((item) => (
                  <details className={styles.question} key={item.question}>
                    <summary>
                      <span>{item.question}</span>
                      <AppIcon name="plus" size={18} />
                    </summary>
                    <div className={styles.answer}>{item.answer}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
