const groups = {
  "Fruta": "abacaxi acerola ameixa amora banana cajá caju caqui carambola cereja coco cupuaçu figo framboesa goiaba graviola jabuticaba kiwi laranja limão maçã mamão manga maracujá melancia melão morango pera pêssego pitanga tangerina uva",
  "Animal": "abelha águia alpaca aranha arraia baleia barata sabiá besouro búfalo cabrito cachorro camelo canário capivara caracol carneiro cavalo cervo chimpanzé coelho coruja crocodilo cupim dragão elefante ema escorpião esquilo foca formiga gafanhoto galinha ganso gato girafa golfinho gorila grilo hamster hiena hipopótamo jacaré jaguar javali joaninha lagarto lagosta leopardo lhama libélula lobo macaco mariposa morcego mosquito mula ovelha panda pantera papagaio pardal pato pavão peixe pinguim porco polvo preguiça raposa rato rinoceronte rouxinol sapo serpente tartaruga tatu tigre toupeira tubarão urubu veado zebra",
  "Comida": "açúcar azeite bacon batata biscoito bolacha brigadeiro brócolis canela carne castanha cebola cenoura cereal churrasco cuscuz farinha feijão fígado frango geleia iogurte lasanha lentilha macarrão manteiga milho mingau mistura mortadela omelete palmito panqueca pastel pepino pimenta presunto queijo quiabo rabanete salada salsicha sanduíche sopa tapioca tomate torrada trigo verdura vinagre",
  "Casa": "almofada banheiro bancada batente berço biblioteca cadeira calçada campainha cozinha corredor cortina despensa escada espelho garagem gaveta geladeira janela lareira lâmpada lavanderia lençol lixeira madeira mesa moradia parede panela quarto quintal relógio sofá tapete telhado torneira varanda",
  "Natureza": "árvore arbusto areia cachoeira campo cascalho cerrado chuva cipó colina cometa deserto floresta geleira grama lago lagoa montanha nascente neblina oceano planeta riacho rocha serra sombra terreno trovão universo vulcão",
  "Objetos": "agenda alicate anel apito armário arquivo avental balança bandeja brinquedo bússola caderno caneta canivete carteira chave colher escova estante faca garrafa grampeador isqueiro jornal livro mala martelo moeda mochila pacote pincel quadro tapete tesoura tijolo toalha vassoura violino",
  "Escola": "aluno caderno cadeira calculadora caneta carteira cartolina ciência classe colégio desenho dicionário exercício estudante estudo estojo faculdade folha formulário geografia gramática história leitura matéria matemática mochila professor prova redação régua resumo tesoura turma universidade",
  "Cidade": "avenida bairro biblioteca calçada cartório cemitério cinema cidade comércio edifício esquina estação fábrica fazenda feira garagem hospital igreja mercado monumento padaria palácio parque praça prefeitura prédio rodovia shopping teatro terminal trânsito tribunal universidade",
  "Corpo": "abdômen bochecha cabelo cabeça cintura cotovelo dente dedo garganta joelho língua mão nariz ombro ouvido pálpebra peito pescoço pulmão rosto sobrancelha tornozelo barriga braço coluna coração estômago fígado músculo sangue tendão",
  "Profissão": "advogado agricultor artesão bombeiro cabeleireiro caminhoneiro cozinheiro dentista desenhista eletricista enfermeiro engenheiro entregador escritor estudante farmacêutico jornalista marceneiro mecânico médico motorista padeiro pedreiro pescador pintor policial professor psicólogo secretário soldado veterinário",
  "Esporte": "atletismo basquete beisebol boliche boxe corrida ciclismo esporte futebol ginástica golfe handebol hóquei judô maratona natação patinação remo rugby surfe taekwondo tênis voleibol xadrez",
  "Tecnologia": "antena aplicativo arquivo bateria câmera celular circuito computador conexão controle teclado internet memória mensagem monitor mouse navegador programa rede robótica satélite sistema software telefone televisão transmissor teclado eletrônico",
  "Roupa": "agasalho avental blusão botão camisa camisola casaco chinelo sobretudo cinto colar camiseta gravata jaqueta joelheira macacão meia uniforme vestido",
  "Música": "acorde acordeão bateria canção cantor cavaquinho clarinete compositor concerto flauta guitarra instrumento melodia microfone música músico partitura piano saxofone tambor trompete violão",
  "Transporte": "ambulância avião bicicleta bonde barco caminhão carreta carruagem carro charrete helicóptero metrô motocicleta ônibus patinete pedestre plataforma reboque táxi trator trem veículo",
  "Viagem": "aeroporto bagagem caminho destino excursão férias fronteira hospedagem itinerário jornada mochila passeio passagem passageiro roteiro turismo turista viagem viajante visita",
  "Sentimento": "amizade ansiedade carinho ciúme coragem desejo esperança felicidade gratidão humildade inveja liberdade medo orgulho paixão paciência saudade surpresa tristeza vergonha",
  "Adjetivo": "aberto alegre amarelo antigo apertado bonito brilhante calmo cansado capaz carinhoso certo claro colorido contente curioso delicado difícil divertido famoso fácil escuro estranho excelente feliz forte gentil grande honesto inteligente interessante jovem justo lento livre maduro maravilhoso moderno nervoso novo ocupado paciente pequeno perigoso perfeito popular possível precioso rápido raro responsável seguro sincero simples tranquilo útil valente verdadeiro",
  "Lugar": "abrigo academia aldeia alojamento ambiente apartamento arquipélago asilo auditório avenida biblioteca cabana cafeteria capela castelo catedral chalé chácara distrito escritório estádio hotel ilha laboratório mansão mosteiro museu oficina pousada restaurante santuário sítio templo",
};

function normalize(word) {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function pluralize(word) {
  if (word.endsWith("m")) return `${word.slice(0, -1)}ns`;
  if (/[aeo]$/.test(word)) return `${word}s`;
  if (word.endsWith("r")) return `${word}es`;
  return null;
}

const entries = new Map();
for (const [category, list] of Object.entries(groups)) {
  for (const word of list.split(/\s+/)) {
    if (word.length >= 5 && word.length <= 12) {
      entries.set(normalize(word), { word, category });
    }

    const plural = pluralize(word);
    if (plural && plural.length >= 5 && plural.length <= 12) {
      entries.set(normalize(plural), { word: plural, category });
    }
  }
}

export const WORDS = [...entries.values()];
