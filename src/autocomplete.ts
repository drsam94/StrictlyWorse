export function autocomplete(inp: HTMLInputElement, arr: string[], cb: (k: any) => void) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    let currentFocus: number = -1;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (e) {
      let val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists(null);
      if (!val) { return false; }
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      let a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      a.style.position = "absolute";
      a.style.border = "1px solid #d4d4d4";
      a.style.zIndex = "99";
      a.style.top = "100%";
      a.style.left = "0";
      a.style.right = "0";
  
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode!.appendChild(a);
      /*for each item in the array...*/
      for (const elem of arr) {
        /*check if the item starts with the same letters as the text field value:*/
        const baseIndex = 0;
        const modifiedVal = val.substring(baseIndex).trim();
        let prefix = elem.substring(0, modifiedVal.length);
        if (prefix.toUpperCase() == modifiedVal.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          let b = document.createElement("div");
          /*make the matching letters bold:*/
          b.innerHTML += "<strong>" + prefix + "</strong>";
          b.innerHTML += elem.substring(modifiedVal.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value=\"" + elem + "\">";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function () {
            /*insert the value for the autocomplete text field:*/
            let keptBase = "";
            inp.value = keptBase + this.getElementsByTagName("input")[0].value;
            /*close the list of autocompleted values,
            (or any other open lists of autocompleted values:*/
            closeAllLists(null);
            cb({key: "Enter"});
          });
          b.style.padding = "10px";
          b.style.cursor = "pointer";
          b.style.backgroundColor = "#fff";
          b.style.borderBottom = "1px solid #d8d4d4";
          b.style.textAlign = "left";
          a.appendChild(b);
        }
      }
      return true;
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
      let fullList = document.getElementById(this.id + "autocomplete-list");
      if (!fullList) {
        return;
      }
      let x = fullList.getElementsByTagName("div");
      if (e.key == "ArrowDown") {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.key == "ArrowUp") {
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.key == "Enter") {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
    });
    function addActive(x: HTMLCollectionOf<HTMLDivElement>) {
      /*a function to classify an item as "active":*/
      if (!x) return;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = x.length - 1;
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
  
    function removeActive(x: HTMLCollectionOf<HTMLDivElement>) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (let i = 0; i < x.length; ++i) {
        x[i].classList.remove("autocomplete-active");
      }
    }
  
    function closeAllLists(elmnt: EventTarget | null) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      let x = document.getElementsByClassName("autocomplete-items");
      for (let i = 0; i < x.length; ++i) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode!.removeChild(x[i]);
        }
      }
    }
  
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
      closeAllLists(e.target);
    });
  }