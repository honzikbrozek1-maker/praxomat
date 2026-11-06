//načtení uložených rcenzí z LocalStorage a spojení s daty z data.js, aby se zobrazily i recenze, které uživatelé přidali
const ulozeneRecenze = JSON.parse(localStorage.getItem("praxomat_recenze")) || []; //Načte recenze z LocalStorage, nebo vytvoří prázdný pole, pokud žádné nejsou
const vsechnyRecenze = [...ulozeneRecenze, ...recenzeData]; //Spojí uložené recenze s daty z data.js do jednoho pole

const kontejnerRecenzi = document.getElementById("recenze-grid"); //sáhnout si na prvek s daným id, uložit odkaz na něj do proměnné
const modal = document.getElementById("detail-modal");
const modalObsah = document.getElementById("modal-detail-obsah");
const modalZavrit = document.getElementById("modal-zavrit");

// ============================================================
// Dynamické Naplnění Roletky Měst z recenzí
// ============================================================
function naplnRoletkuMest()
{
     const unikatniMesta = []; // Pole pro ukládání měst bez duplicit

     vsechnyRecenze.forEach(function (polozka) //Projít všechny recenze a zložíme jen ta města, která ještě v poli nejsou 
     {
          if(polozka.mesto && !unikatniMesta.includes(polozka.mesto))
          {
               unikatniMesta.push(polozka.mesto); //Metoda includes() kontrolucící, jestli tam město už je
          }
     });
     unikatniMesta.sort(); // Abecední řazení měst
     roletkaMest.innerHTML ='<option value="all">Všechna města</option>'; //Vynulování roletky a nastavení výchozí možnosti all

     //Vytvoření značky <option> pro každé unikátní město  do html roletky
     unikatniMesta.forEach(function (mesto)
     {
          const moznost = document.createElement("option");
          moznost.value = mesto;
          moznost.textContent = mesto;
          roletkaMest.appendChild(moznost); // .appendChild() vloží do roletky novou možnost
     })
}

// ============================================================
// Seskupení recenzí podle firem a výpočet průměru hodnocení
// ============================================================
function seskupPodleFirem(seznamRecenzi)
{
     const firmyObjekt = {};
     //Projít jednotlivé recenze a roztřídíme je do objektu podle názvu fimy
     seznamRecenzi.forEach(function (polozka)
     {
          const klic = polozka.firma.toLowerCase().trim() //Převod na malá ůísmena pro porovnání
          const hezkyNazev = polozka.firma.charAt(0).toUpperCase() + polozka.firma.slice(1);  //uložit si název firmy a 1. písmeno bude velké
          if (!firmyObjekt[klic]) //když složka pro tuto firmu ještě neexistuje, tak se založí
          {
               firmyObjekt[klic] = 
               {
                    firma: hezkyNazev,
                    mesto: polozka.mesto,
                    obory: [],// sbírání zkratek kódů (např. ["it", "ekonomika"])
                    oboryNazvy: [], //sbírání textu pro zobrazení (např. ["informační technologie",...])
                    seznam: [] //založit prázdné pole, do kterého se sbírají jednotlivé recenze
               };
          }
          //přidání oboru do seznamu firmy, pokud tam ze starší recenze ještě není zpasaný -- více oborů pro jednu firmu
          const nazevOboru = polozka.oborNazev || polozka.obor;
          if (polozka.obor && !firmyObjekt[klic].obory.includes(polozka.obor))
          {
               firmyObjekt[klic].obory.push(polozka.obor);// .push přidává jeden nebo více nových prvků na konec pole a vací novou délku pole
               firmyObjekt[klic].oboryNazvy.push(nazevOboru);
          }
          firmyObjekt[klic].seznam.push(polozka); //ať už složka existovala, či nikoliv, přidat (.push) do jejího seznamu aktuální recenzi
     });

     // Převedení objektu na pole a spočítání průměru hvězdiček
     return Object.values(firmyObjekt).map(function (f) { //vytáhne pole jednotlivých složek firem, .map() projde pole firmu po firmě, (f) - proměnná pro zpracovávanou firmu 
          const pocet = f.seznam.length;

          // sečíst všechny hodnocení dané firmy
          const soucet = f.seznam.reduce(function (sum, rec)
          {
               return sum + rec.hodnoceni;
          }, 0);

          
          const prumer = (soucet / pocet).toFixed(1);//Spočítání průměru a zaokrouhlední na 1 desetinné místo        
          const posledniRecenze = f.seznam[f.seznam.length - 1];  //vezme nejnovější recenzi pro zobrazení textu a odměny
          const odmenaZobrazit = posledniRecenze.financniOdmena || posledniRecenze.odmena || "Neuvedeno"; // načtení odměny (používatl jsem oba názvy)

          return {  //tady nemohu dát závorku na druhý řádek - jinak to nefunguje
               firma: f.firma,
               mesto: f.mesto,
               obory: f.obory,
               oboryNazvy: f.oboryNazvy,
               hodnoceniPrumer: prumer,
               pocetRecenzi: pocet, 
               text: posledniRecenze.text,
               financniOdmena: odmenaZobrazit
          };
     });
}


//======================================================
// OTETVŘENÍ MODÁLNÍHO OKNA S DETAILNÍMI RECENZEMI FIRMY
//=====================================================
function otevriDetailFirmy(nazevFirmy)
{
     //najít všechny jednotlivé recenze, které patří této firmě
     const recenzeFirmy = vsechnyRecenze.filter(function(r) // filter projde úplně všechny recenze v poli
     {
          return r.firma.toLowerCase().trim() === nazevFirmy.toLowerCase().trim(); //porovnání názvu firmy v každé recenzi s tím, na který se kliklo
     })

     if (recenzeFirmy.length === 0) return;//když žádná recenze náhodou neexistuje, tak to ukončí kód, aby v následujících řádcích nespadl

     //Výpočet průměrného hodnocení
     const soucet = recenzeFirmy.reduce((sum,r)=> sum + r.hodnoceni,0);// .reduce sečte hvězdičky ze všech recenzí firmy; číslo "0"=výchozí stav
     const prumer = (soucet / recenzeFirmy.length).toFixed(1); //toFixed = zaokroulování na 1 desetinné číslo

     //vytáhnout všechny unikátní obory této firmy pod hlavičku modalu
     const seznamOboruFirmy = [];
     recenzeFirmy.forEach(function (r)
     {
          const nazevOboru = r.oborNazev || r.obor;
          if (!seznamOboruFirmy.includes(nazevOboru))
          {
               seznamOboruFirmy.push(nazevOboru);
          }
     })
     //sestavení záhlaví toho modálního okna
     let html = `
     <h2>${recenzeFirmy[0].firma}</h2> 
     <p class="karta-mesto">📍 ${recenzeFirmy[0].mesto} | <strong> Obory: </strong> ${seznamOboruFirmy.join(", ")} </p> 
     <p><strong>Průměrné hodnocení: ★ ${prumer} / 5</strong> (${recenzeFirmy.length}x recenze)</p>
     <hr> 
     <h3>Všechny recenze od studentů:</h3> 
     `; //hr - vodorovná dělící čára, 

     // Vypsání každé recenze zvlášť (i se slovním popisem a odměnou)
     recenzeFirmy.forEach(function (r, index) //projít všechny recenze dané firmy one by one; "r" =konkrétní recenze a "index" =její číslo(0,1,2...)
          { 
          const textRecenze = r.text ? `"${r.text}"` : '<em>Hodnocení bez textového popisu</em>'; //kontrola, zda je napsaný text, když ne, tak kurzíva
          const odmenaText = r.financniOdmena || r.odmena || 'Neuvedeno'; // kontrola odměny
          const oborStudenta = r.oborNazev || r.obor || "Obor neuveden" //konkrétní obor této jedné recenze
          // přilepení (+=) k existujícímu HTML další kartičky recenze
          html += ` 
          <div class="modal-recenze-polozka"> 
               <p><strong>Recenze #${index + 1}:</strong> ★ ${r.hodnoceni} / 5</p> 
               <p class="karta-text">${textRecenze}</p> 
               <small>Odměna: <strong>${odmenaText}</strong></small> 
          </div> 
          `;
          }); 
     modalObsah.innerHTML = html; //vložení výsledného sestavení textu a zobrazení
     modal.style.display = "flex"; 
}


//------------------------------------------------------------------------------------------------------------------------------
function vykresliRecenze(seznamKaret) //funkce s parametrem dostane seznam recenzí
{
     kontejnerRecenzi.innerHTML = ""; //Kontejner úplně vyčistit, kdyby v něm byly karty z minula
     if (seznamKaret.length === 0)
     {
          kontejnerRecenzi.innerHTML =`<p>Žádná firma neodpovídá zadaným filtrům.</p>`;
          return;
     }
     seznamKaret.forEach(function (polozka) //projde každou recenzi v poli
     {
          const karta = document.createElement("div"); //pro každou položku vytvoříme nový HTML element <div>
          karta.classList.add("karta-recenze"); //přidat mu třídu "karta-recenze", která už je stylizovaná v CSS
          karta.style.cursor = "pointer";
          karta.addEventListener("click", function ()
          {
               otevriDetailFirmy(polozka.firma); // po kliknutí otevře detail
          });

          //Ošetření nepovinného textu (pokud uživatel žádný nenapsal)
          //let textObsah;
          karta.innerHTML = ` 
          <div>
               <div class="karta-hlavicka">
                    <div>
                         <div class="karta-firma"> ${polozka.firma}</div>
                         <div class="karta-mesto">📍${polozka.mesto}</div>
                    </div>
                    <div class="karta-hvezdy"> ★ ${polozka.hodnoceniPrumer} / 5 <small>(${polozka.pocetRecenzi}x)</small></div>
               </div>
          <span class="karta-obor">${polozka.oboryNazvy.join(", ")}</span> 
          </div>
          <div class="karta-paticka">
          Odměna: <strong>${polozka.financniOdmena}</strong>
          </div>
          `;//dovulují psát HTML do JS a na potřebná místa dosadit proměnno ${polozka.nazev}, ${polozka.firma} atd.
               // .join spojuje čárkou obory v poli (informační technologie, Ekonomika)
          kontejnerRecenzi.appendChild(karta); //vytvořenou kartu vložíme dovnitře naší mřížky na stránce
     });     
}

// ============================================================
// 3. KOMBINOVANÉ FILTROVÁNÍ (TEXT + OBOR + MĚSTO)
// ============================================================

// 1. Výběr obou ovládacích prvků z HTML
const vyhledavaciPole = document.getElementById("search-input");
const roletkaOboru = document.getElementById("obory");
const roletkaMest = document.getElementById("mesto-filtr");

// 2. Jedna společná funkce, která hlídá text i vybraný obor naráz
function filtrujData()
{
     const hledanyText = vyhledavaciPole.value.toLowerCase().trim();
     const vybranyObor = roletkaOboru.value; 
     const vybraneMesto = roletkaMest.value; //Hodnota z nové roletky měst
     const firmySeznam = seskupPodleFirem(vsechnyRecenze);//Sloučení všech recenzí podle firem


     const vysledek = firmySeznam.filter(function (polozka) //vyfiltrování  seznamu firem podle všech 3 kritérií najednou
     {
          const oboryText = polozka.oboryNazvy ? polozka.oboryNazvy.join(" ").toLowerCase() :""; //Bezpečné prohledání textu i v poli oborů; otazník je jako if a dvojtečka je else
          
          const oboryRezetec = polozka.oboryNazvy ? polozka.oboryNazvy.join (" ").toLowerCase() : ""; // prohledání textu v poli oborů, podmínka, že pokud oboryNazvy neexistuje, nastaví se prázdný řetězec
          const odpovidaText = polozka.firma.toLowerCase().includes(hledanyText) || oboryRezetec.includes(hledanyText); //Podmínka 1: Odpovídá název firmy nebo obor hledanému textu?
          const odpovidaObor = (vybranyObor === "all") || polozka.obory.includes(vybranyObor); //Podmínka 2: Je vybrán "all", nebo se shoduje obor? altGr+w | - možnost více oborů pro jednu firmu
          const odpovidaMesto = (vybraneMesto === "all") || (polozka.mesto === vybraneMesto); //Podmínka 3: Je vybrán "all", nebo se shoduje město? 
          return odpovidaText && odpovidaObor && odpovidaMesto; //Vrátí true jen pokud obě podmínky platí
     });
     vykresliRecenze(vysledek); //Překreslit mřízku s výsledky
}

//=======================================
//spodní poslouchače událostí
//=======================================
naplnRoletkuMest(); //naplnění roletky unikátními městy z recenzí
filtrujData(); //spustit filtrování a vykreslení hned při otevření stránky


// 3. Nastavení poslouchačů událostí - web se aktualizuje okamžitě po změně roletky nebo při psaní
vyhledavaciPole.addEventListener("input", filtrujData); // Při psaní do textového pole:
roletkaOboru.addEventListener("change", filtrujData); //Při změně vlolby v roletce (událost "change"):
roletkaMest.addEventListener("change", filtrujData); //Poslouchač pro změnu města

//Zavření modalu při kliknutí na křížek
modalZavrit.addEventListener("click", function () 
{
     modal.style.display = "none";
});

//Zavření modalu při kliknutí kamkoliv mimo bílé okno
window.addEventListener("click", function(udalost)
{
     if (udalost.target === modal)
     {
          modal.style.display = "none";
     }
});
