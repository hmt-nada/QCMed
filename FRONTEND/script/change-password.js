// ================= Eye toggle password =================
const eyeclose1=document.getElementById('eyeclose1');
const eyeopen1=document.getElementById('eyeopen1');
const eyeclose2=document.getElementById('eyeclose2');
const eyeopen2=document.getElementById('eyeopen2');
const eyeclose3=document.getElementById('eyeclose3');
const eyeopen3=document.getElementById('eyeopen3');

const password=document.getElementById('password1');
const password2=document.getElementById('password2');
const confirmation=document.getElementById('password3');

function toggleEye(eyeClose, eyeOpen, input) {
    eyeClose.addEventListener('click', () => {
        eyeClose.style.display="none";
        eyeOpen.style.display="block";
        eyeClose.classList.remove("visible");
        eyeClose.classList.add("hidden");
        eyeOpen.classList.remove("hidden");
        eyeOpen.classList.add("visible");
        input.setAttribute("type","text");
    });
    eyeOpen.addEventListener('click', () => {
        eyeOpen.style.display="none";
        eyeClose.style.display="block";
        eyeOpen.classList.remove("visible");
        eyeOpen.classList.add("hidden");
        eyeClose.classList.remove("hidden");
        eyeClose.classList.add("visible");
        input.setAttribute("type","password");
    });
}

toggleEye(eyeclose1, eyeopen1, password);
toggleEye(eyeclose2, eyeopen2, password2);
toggleEye(eyeclose3, eyeopen3, confirmation);

// ================= Input code navigation =================
const inputs = document.querySelectorAll('.code-input');
inputs.forEach((input, index) => {
  input.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      e.preventDefault();
      if (input.value.length > 0) {
        if (index < inputs.length - 1) inputs[index + 1].focus();
        else input.blur();
      }
    }
  });
});

// ================= Validation mot de passe =================
const mssgerreur=document.getElementById('erreur');
let champDéjàBlur = false;
let passinvalid2=false;

password2.addEventListener('input',()=>{
  const firstpassword=password2.value;
  if(firstpassword===""){
      password2.style.borderColor = "";
      password2.classList.remove('valide');
      mssgerreur.style.display="none";
      document.getElementById('erreuridentique').style.display="none";
  } else if(champDéjàBlur) {
      if(firstpassword.length < 6){
          passinvalid2=true;
          password2.style.borderColor="red";
          mssgerreur.style.display="block";
          password2.classList.remove('valide');
          document.getElementById('erreuridentique').style.display="none";
      } else {
          passinvalid2=false;
          password2.style.borderColor="";
          password2.classList.add('valide');
          mssgerreur.style.display="none";
          document.getElementById('erreuridentique').style.display="none";
      }
  }
});

password2.addEventListener('blur',()=>{
  champDéjàBlur=true;
  const firstpassword=password2.value;
  if(firstpassword===""){
      password2.style.borderColor = "";
      password2.classList.remove('valide');
      mssgerreur.style.display="none";
      document.getElementById('erreuridentique').style.display="none";
  } else if(firstpassword.length < 6){
      passinvalid2=true;
      password2.style.borderColor="red";
      mssgerreur.style.display="block";
      document.getElementById('erreuridentique').style.display="none";
  } else {
      passinvalid2=false;
      password2.classList.add('valide');
      mssgerreur.style.display="none";
      document.getElementById('erreuridentique').style.display="none";
  }
});

// ================= Confirmation mot de passe =================
const mssgerreur2=document.getElementById('erreur2');
let champblur=false;
let confinvalid=false;

confirmation.addEventListener('input',()=>{
  const firstpassword=password2.value;
  const passwordconfirme=confirmation.value;
  if(passwordconfirme===""){
      confirmation.style.borderColor = "";
      confirmation.classList.remove('valide');
      mssgerreur2.style.display="none";
  } else if(champblur){
      if(passwordconfirme != firstpassword){
          confinvalid=true;
          confirmation.style.borderColor="red";
          confirmation.classList.remove('valide');
          mssgerreur2.style.display="block";
      } else {
          confinvalid=false;
          confirmation.style.borderColor="";
          confirmation.classList.add('valide');
          mssgerreur2.style.display="none";
      }
  }
});

confirmation.addEventListener('blur',()=>{
  champblur=true;
  const firstpassword=password2.value;
  const passwordconfirme=confirmation.value;
  if(passwordconfirme===""){
      confirmation.style.borderColor = "";
      confirmation.classList.remove('valide');
      mssgerreur2.style.display="none";
  } else if(passwordconfirme != firstpassword){
      confinvalid=true;
      confirmation.style.borderColor="red";
      mssgerreur2.style.display="block";
  } else {
      confinvalid=false;
      confirmation.classList.add('valide');
      mssgerreur2.style.display="none";
  }
});

// ================= Vérification bouton =================
const boutton=document.getElementById('boutton');
boutton.addEventListener('click',function(event){
    let erreur=false;
    let passchamp1=false;
    let passchamp2=false;
    let passchamp3=false;

    if(password.value.trim()===""){ erreur=true; passchamp1=true; password.style.borderColor="red";}
    if(password2.value.trim()==="" || passinvalid2){ erreur=true; passchamp2=true; password2.style.borderColor="red";}
    if(confirmation.value.trim()==="" || confinvalid){ erreur=true; passchamp3=true; confirmation.style.borderColor="red";}

    // --- Nouvelle vérification : ancien != nouveau
    if(password.value.trim() !== "" && password2.value.trim() !== "" && password.value === password2.value){
        erreur=true;
        passchamp2=true;
        password2.style.borderColor="red";
        document.getElementById('erreuridentique').style.display="block";
    }else{
       document.getElementById('erreuridentique').style.display="none";
    }

    if(erreur){ event.preventDefault(); return; }

    // --- Fetch pour changer mot de passe
    fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            currentPassword: password.value,
            newPassword: password2.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.message){
            password.classList.add('valide');     
            document.getElementById('missmatch').style.display="none";
            passchamp1=false;
            sessionStorage.setItem("passwordSuccess", "true");
            location.reload(); 
        } else if(data.error){
            password.style.borderColor="red";
            password.classList.remove('valide');     
            document.getElementById('missmatch').style.display="block";
            passchamp1=true;
        }
    })
    .catch(error => { alert("Erreur réseau : " + error.message); });

    // ===== Réinitialisation champs =====
    password.addEventListener('input',()=>{
        if(passchamp1){ password.style.borderColor=""; password.classList.remove('valide'); document.getElementById('missmatch').style.display="none"; }
    });
    password2.addEventListener('input',()=>{ if(passchamp2){ password2.style.borderColor=""; password2.classList.remove('valide'); }});
    confirmation.addEventListener('input',()=>{ if(passchamp3){ confirmation.style.borderColor=""; confirmation.classList.remove('valide'); }});
});

// ================= Affichage pseudo/avatar + alert =================
window.addEventListener("DOMContentLoaded", () => {
    if(sessionStorage.getItem("passwordSuccess")==="true"){
        document.getElementById('alert_erreur').classList.remove("visible"); 
        void document.getElementById('alert_erreur').offsetWidth;
        document.getElementById('alert_erreur').classList.add("visible");
        setTimeout(()=>{ document.getElementById('alert_erreur').classList.remove("visible"); }, 2000);
        sessionStorage.removeItem("passwordSuccess");
    }

    fetch(`/api/utilisateur`)
    .then(response => response.json())
    .then(result => {
        if(result.success){
            const user = result.utilisateur;
            document.getElementById("avatar").src = user.avatar;
            document.getElementById("pseudo").textContent = user.pseudo;
        } else {
            document.getElementById("pseudo").textContent = "Inconnu";
        }
    })
    .catch(err => {
        console.error("Erreur récupération utilisateur :", err);
        document.getElementById("pseudo").textContent = "Erreur";
    });
});
