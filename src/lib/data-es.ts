// Spanish versions of the starter content. Matched to data.ts by id (or by position for
// reviews/FAQs). Once the owner edits things in /admin, the database copy wins.

export const servicesEs: Record<string, { name: string; blurb: string }> = {
  "cut-signature": { name: "Corte y peinado signature", blurb: "Consulta, lavado, un corte pensado para tu estructura facial y tu rutina diaria, peinado para salir." },
  "cut-bob": { name: "Bob y cortes cortos", blurb: "Recto, suave, micro o desfilado. Geometría que se mueve contigo." },
  "cut-fringe": { name: "Retoque de flequillo", blurb: "Cortina, desflecado o recto. Un retoque rápido entre cortes." },
  "color-root": { name: "Raíz y brillo", blurb: "Cobertura de raíz sin cortes marcados con un baño de brillo para un acabado de espejo." },
  "color-allover": { name: "Color con dimensión", blurb: "Tono completo mezclado a medida con profundidad pintada a mano, nunca plano." },
  "color-vivid": { name: "Color vivo y fantasía", blurb: "Cobre, orquídea, esmeralda, cereza. Color saturado que dura." },
  "blonde-highlights": { name: "Mechas con papel", blurb: "Mechas finas y estratégicas para más luz con un crecimiento natural." },
  "blonde-balayage": { name: "Balayage pintado a mano", blurb: "Luz natural, pintada a mano alrededor del rostro, con efecto de sol." },
  "blonde-platinum": { name: "Transformación a platino", blurb: "De oscuro a hielo en sesiones planeadas y protegidas con reparación capilar." },
  "style-blowout": { name: "Secado signature", blurb: "Volumen, rebote o liso espejo. Hecho para durar días." },
  "style-updo": { name: "Recogido para eventos", blurb: "Trenzas, torsiones, moños lisos y formas suaves y románticas." },
  "style-bridal": { name: "Prueba de novia", blurb: "Tu look de boda, ensayado. Inspiración, ajustes y un plan para el gran día." },
};

export const addonsEs: Record<string, { name: string; blurb: string }> = {
  "add-gloss": { name: "Brillo", blurb: "Tono + brillo de cristal" },
  "add-bond": { name: "Reparación capilar", blurb: "Reconstruye la fuerza durante el servicio" },
  "add-scalp": { name: "Ritual de cuero cabelludo", blurb: "Masaje, exfoliación y mascarilla" },
  "add-blowout": { name: "Agregar secado", blurb: "Termina con un peinado" },
};

export const looksEs: Record<string, { title: string; story: string; hours: string }> = {
  "honey-veil": { title: "Velo de miel", story: "Café espresso nivel 4 aclarado a miel cálida, pintado a mano para que la luz caiga como un velo.", hours: "3.5 h" },
  "copper-silk": { title: "Seda cobre", story: "Un cobre de mucho brillo con raíz más oscura para dar dimensión sin verse plano.", hours: "3.5 h" },
  "midnight-orchid": { title: "Orquídea de medianoche", story: "Negro azulado que se funde en orquídea en las puntas. Color fantasía con elegancia.", hours: "4 h" },
  "platinum-halo": { title: "Halo platino", story: "De negro a hielo en dos sesiones, con reparación capilar en cada paso.", hours: "5 h" },
  "soft-curtain-bob": { title: "Bob con cortina suave", story: "Bob a la clavícula con flequillo cortina que enmarca el rostro. Se seca al aire.", hours: "1.25 h" },
  "rose-quartz-waves": { title: "Ondas cuarzo rosa", story: "Brillo rosado suave con ondas sueltas hechas con calor que duran todo el fin de semana.", hours: "1 h" },
  "crown-braid": { title: "Trenza corona", story: "Una trenza corona romántica con mechones sueltos y preparación para flores frescas.", hours: "1.5 h" },
  "espresso-gloss": { title: "Brillo espresso", story: "Brillo de chocolate profundo con acabado de espejo. Rico, nunca negro.", hours: "2 h" },
  "bouncy-curl": { title: "Rizos con rebote", story: "Corte en seco para rizos, para que cada espiral quede exactamente donde debe.", hours: "1.5 h" },
  "sunlit-lob": { title: "Lob con luz de sol", story: "Lob hasta los hombros con mechas finas; la luminosidad crece de forma suave.", hours: "3 h" },
  "wedding-chignon": { title: "Chongo de boda", story: "Chongo bajo y esculpido con acabado satinado. Sale hermoso en fotos.", hours: "1.25 h" },
  "emerald-edge": { title: "Borde esmeralda", story: "Verde bosque profundo con una capa inferior brillante que destella al moverte.", hours: "4 h" },
};

export const reviewsEs: { service: string; quote: string }[] = [
  { service: "Balayage pintado a mano", quote: "Llegué nerviosa por aclararme y salí sintiéndome la mejor versión de mí. Tres meses después sigue viéndose costoso." },
  { service: "Prueba de novia", quote: "Escuchó cada tablero de Pinterest que le mandé y de algún modo lo mejoró. Mi peinado aguantó el baile y la lluvia." },
  { service: "Corte signature", quote: "El mejor corte de mi vida. Cae perfecto aun cuando no hago nada. Ese es todo el punto." },
  { service: "Color vivo", quote: "Orquídea que se queda orquídea. Otros estilistas me lo desvanecían en dos semanas; este ha durado dos meses." },
  { service: "Transformación a platino", quote: "De negro a platino y mi cabello sigue sano. No pensé que fuera posible." },
  { service: "Bob y cortes cortos", quote: "Solo la consulta ya valió la pena. Me explicó por qué cada decisión me favorecía, no solo qué estaba de moda." },
];

export const faqsEs: { q: string; a: string }[] = [
  { q: "¿De cuánto es el depósito y es reembolsable?", a: "Los depósitos van de $0 a $100 según el servicio y se aplican a tu total final. Son reembolsables o transferibles con 48 horas de aviso." },
  { q: "¿Qué pasa si necesito reprogramar?", a: "La vida pasa. Puedes mover tu cita sin costo hasta 48 horas antes. Dentro de las 48 horas, el depósito se aplica a tu próxima visita." },
  { q: "¿Necesito una consulta para un cambio grande de color?", a: "Para correcciones y cambios drásticos recomendamos primero una consulta gratis de 15 minutos. Reserva «Retoque de flequillo» o escríbenos y te hacemos espacio." },
  { q: "¿Cuánto tardará mi servicio?", a: "La herramienta de reservas suma tus servicios y muestra la hora exacta de término antes de confirmar." },
  { q: "¿Puedo traer fotos de inspiración?", a: "Por favor hazlo. Envíalas con las notas de tu reserva o tráelas ese día. Hablaremos de lo que es realista para tu historial capilar." },
  { q: "¿Trabajan color en todo tipo de cabello?", a: "Sí. Liso, ondulado, rizado y afro, con técnicas protectoras adaptadas a cada tipo." },
];

export const settingsEs = {
  tagline: "Salón de belleza",
  heroBlurb: "Un salón privado de color y corte. Cada cabello es una composición única: tono, luz y forma, creada para ti.",
  aboutTitle: "El cabello es el único accesorio que nunca te quitas.",
  aboutBody:
    "Soy Fabiola. Por más de una década he construido mi trabajo sobre consultas lentas y honestas y un color que crece de forma hermosa. Sin prisas, sin fórmulas de molde: una persona a la vez, en un salón tranquilo donde puedes respirar.",
  directionsNote: "Estacionamiento gratis al frente.",
};
