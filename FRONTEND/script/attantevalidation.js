document.getElementById('resend').addEventListener('click',()=>{
const email=sessionStorage.getItem("emailInscrit");
const data ={
    email:email
  };
  console.log("DATA ENVOYÉ :", data); 
//evoie une requête HTTP a cette address
fetch("/api/resend-confirmation",{
  //préciser la méthode de l'envoie:post(pour l'accepter en backend on a fait post)
  method:"post",
  //on indique que les données sont en format json
  headers:{
    "content-type":"application/json"
  },
  //convertit l'objet data en format json pour que le backend le comprend 
  body:JSON.stringify(data),
})
  //quand le serveur répond on transfère la réponse en objet js depuis json
   .then(response=>response.json())
   //result une variable qui contient la réponse du serveur 
   .then(result =>{
    //si succss est true(inscription reussie)
    if (result.success){   
          
    }else{
        sessionStorage.removeItem("emailInscrit");
        alert("erreur:"+result.message);
    }
   })
//gestion des erreurs du reseau (connection avec serveur )
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
});
});