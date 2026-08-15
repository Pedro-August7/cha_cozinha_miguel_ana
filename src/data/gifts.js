export const DATA = [
        {
          key: "cozinha",
          title: "Cozinha",
          items: [
            ["Ralador", "grater"],
            ["Descascador de legumes", "peeler"],
            ["Abridor de latas", "canOpener"],
            ["Escorredor de arroz/macarrão", "colander"],
            ["Tabuleiro", "bakingTray"],
            ["Refratário (marinex)", "glassDish"],
            ["Forma de bolo com furo", "cakeMold"],
            ["Tigelas/bowls", "bowl"],
            ["Frigideira antiaderente", "fryPan"],
            ["Forma de gelo", "iceTray"],
            ["Tábua para corte", "cuttingBoard"],
            ["Peneira", "colander"],
            ["Faca grande p/ cozinha", "knifeSet"],
            ["Socador de alho", "garlicPress"],
            ["Descanso de panela", "trivet"],
          ],
        },
        {
          key: "utensilios",
          title: "Utensílios",
          items: [
            ["Fuet", "whisk"],
            ["Copo medidor", "measuring"],
            ["Martelo de carne", "meatMallet"],
            ["Escumadeira", "skimmer"],
            ["Colher de arroz", "woodSpoon"],
            ["Luva de cozinha", "gloves"],
            ["Colher de pau", "woodSpoon"],
            ["Concha para feijão", "ladle"],
            ["Espremedor de batata", "potatoMasher"],
            ["Colher de sorvete", "iceScoop"],
            ["Pegador de alimentos", "tongs"],
            ["Pincel de silicone", "brush"],
            ["Espátula", "spatula"],
            ["Rolo de abrir massas", "rollingPin"],
            ["Cortador de pizza", "pizzaCutter"],
          ],
        },
        {
          key: "mesa",
          title: "Mesa",
          items: [
            ["Suplat", "placemat"],
            ["Boleira", "cakeStand"],
            ["Caneco médio", "glass"],
            ["Saleiro e paliteiro", "spiceRack"],
            ["Queijeira", "cheeseDome"],
          ],
        },
        {
          key: "organizacao",
          title: "Organização",
          items: [
            ["Escorredor de louças", "dryRack"],
            ["Potes herméticos", "jar"],
            ["Porta frios", "organizer"],
            ["Garrafas de água (para geladeira)", "pitcher"],
          ],
        },
        { key: "eletro", title: "Eletroportáteis", items: [["Mini triturador", "blender"]] },
      ];

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
