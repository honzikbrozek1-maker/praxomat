// 1. Najít formulář v HTML podle jeho ID
const formular = document.getElementById("formular-recenze");
const potvrzeniBlok = document.getElementById("potvrzeni-blok");
const zpravaText = document.getElementById("potvrzeni-zprava");
//Načtení ovládacích prvků pro novou firmu
const firmaSelect = document.getElementById("firma-select");
const blokNovaFirma = document.getElementById("blok-nova-firma");
const firmaNovaInput = document.getElementById("firma-nova");
//Načtení ovlácacích prvků pro jiné město
const mestoSelect = document.getElementById("mesto-select");
const blokJineMesto = document.getElementById("blok-jine-mesto");
const mestoJineInput = document.getElementById("mesto-jine");


// Reakce na výběr v roletce firem
// "change" se spustí pokaždé, když uživatel vybere jinou možnost v roletce
firmaSelect.addEventListener("change", function ()
{
  if (firmaSelect.value === "nova_firma") //Pokud uživatel vybral "Přidat novou firmu"
  {
    blokNovaFirma.style.display = "block"; //Zobrazí se textové pole pro zadání nové firmy
    firmaNovaInput.required = true; //Pole - povinné
  }
  else //vybral stávající (předdefinovanou) firmu
  {
    blokNovaFirma.style.display = "none"; //Pole pro zadání nové firmy bude skryté
    firmaNovaInput.required = false; //Pole - nepovinné
    firmaNovaInput.value = ""; // Vyčištění prípadného předchozího textu
  }
})

//reakce na výběr v roletce měst
mestoSelect.addEventListener("change", function () 
{
  if (mestoSelect.value ==="jine") //uživatel vybral "Jiné město"
  {
    blokJineMesto.style.display = "block";
    mestoJineInput.required = true;
  }
  else //vybral stávající (předdefinované) město - schování pole
  {
    blokJineMesto.style.display = "none";
    mestoJineInput.required = false;
    mestoJineInput.value = "";
  }
})



formular.addEventListener("submit", function (udalost) 
{
  udalost.preventDefault();

  // Ochrana proti botům (HONEYPOT): Pokud je SKRYTÉ POLE vyplněné, ukončí se funkce a formulář se neodešle
  const honeypot = document.getElementById("honeypot").value;
  if (honeypot !== "") 
  {
    return; //Pokud bot pole vyplnil, zastaví se vykonávání funkce
  }

  //určení výsledného názvu firmy
  let nazevFirmy = firmaSelect.value;
  if (nazevFirmy === "nova_firma")
  {
    nazevFirmy= firmaNovaInput.value.trim(); //trim() odstraní mezery na začátku a konci textu - pokud byla vybrána nová firma
  }
  let nazevMesta = mestoSelect.value;
  if(nazevMesta === "jine")
  {
    nazevMesta = mestoJineInput.value.trim(); // Zase trim() odstraňující mezery 
  }
  //Vytvoření objektu recenze z formuláře
  const oborSelect = document.getElementById("obor");
  const novaRecenze = 
  {
    id: Date.now(), //Vytvoří unikátní ID podle aktuálního času
    firma: nazevFirmy,
    obor: oborSelect.value,
    oborNazev: oborSelect.options[oborSelect.selectedIndex].text, //Získá text vybrané možnosti z roletky
    mesto: nazevMesta,
    hodnoceni: parseInt(document.getElementById("hodnoceni").value), //Převede hodnotu z formuláře na celé číslo
    financniOdmena: document.getElementById("odmena").value, 
    text: document.getElementById("text-recenze").value.trim() //Odstraní mezery na začátku a konci textu,
  }; //Díky tomu se stránka neobnoví/neproblikne, ale JavaScript převezme řízení – v klidu načte hodnoty z políček, uloží je do `localStorage`, schová formulář a zobrazí zelené potvrzení.

  // Uložení do Localstorage
  const ulozeneRecenze = JSON.parse(localStorage.getItem("praxomat_recenze")) || []; // Načíst uložené recenze z LocalStorage, nebo vytvořit prázdné pole, pokud žádné nejsou
  ulozeneRecenze.unshift(novaRecenze); //Přidá novou recenzi na začátek pole
  localStorage.setItem("praxomat_recenze", JSON.stringify(ulozeneRecenze));
  
  zpravaText.innerText = `Děkujeme! Recenze pro firmu ${nazevFirmy} byla úspěšně zaznamenána.`;// Nastavení textu potvrzení zprávy s názvem firmy, kterou uživatel zadal do formuláře
  // Schování formuláře a zobrazení bloku s potvrzením a tlačítkem zpět
  formular.style.display = "none";
  potvrzeniBlok.style.display = "block";
});