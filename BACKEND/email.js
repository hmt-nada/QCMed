const nodemailer = require("nodemailer");

async function envoyerEmailConfirmation(email, lien) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd"
    },
    tls: {
    rejectUnauthorized: false
  },
  secure:true
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',
    to: email,
    subject: ' Confirmez votre inscription à QCMed ',
    html: `
     <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
     
      <!-- En-tête -->
        <div style="background: linear-gradient(90deg, #0077b6, #00b4d8); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">QCMed</h1>
        </div>

        <!-- Contenu principal -->
        <div style="padding: 30px; text-align: center;font-weight: bold;">
          <h2 style="color: #0077b6; margin-bottom: 10px;font-size: 30px;">Bienvenue !</h2>
          <p style="font-size: 20px; color: #333;">Merci pour votre inscription.</p>
          <p style="font-size: 20px; color: #333;">
            Pour confirmer votre adresse e-mail, cliquez sur le bouton ci-dessous :
          </p>

          <a href="${lien}" style="display: inline-block; background-color: #0077b6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;font-size: 20px;">
            Activer mon compte
          </a>

          <p style="font-size: 18px; color: #888; margin-top: 20px;">
            Ce lien est valable pendant <strong>24 heures</strong>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 15px; color: #666;font-weight: bold;">
          <p>© 2025 QCMed - Tous droits réservés.</p>
          <p>Vous recevez cet e-mail car votre adresse a été utilisée pour créer un compte sur <strong>QCMed</strong> .Si vous n’êtes pas à l’origine de cette demande, ignorez-le : aucune action ne sera prise.</p>
        </div>

      </div>
    </div>
    `
  });
}

async function envoyerEmailConfirmationcode(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd"
    },
    tls: {
    rejectUnauthorized: false
  },
  secure:true
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',
    to: email,
    subject: 'Votre code de vérification QCMed',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      
      <!-- En-tête -->
      <div style="background: linear-gradient(135deg, #007BFF, #00C6FF); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">QCMed</h1>
      </div>
      
      <!-- Contenu -->
      <div style="padding: 30px; text-align: center; color: #333;font-weight: bold;">
        <h2 style="color: #007BFF; margin-bottom: 10px;">Bienvenue !</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Merci pour votre inscription à <strong>QCMed</strong>.
        </p>
        
        <p style="font-size: 16px; margin-top: 20px;">
          Pour confirmer votre adresse e-mail, veuillez copier le code ci-dessous :
        </p>
        
        <!-- Code de confirmation -->
        <div style="display: inline-block; background: #f0f4ff; color: #007BFF; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px; letter-spacing: 2px; margin: 15px 0;">
          ${code}
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Ce code est valide pendant <strong>1 minute et 30 secondes</strong><br> Après ce délai, le code expirera et vous devrez en demander un nouveau..
        </p>
      </div>
      
      <!-- Pied de page -->
      <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 14px; color: #888;font-weight: bold;">
        <p>Vous recevez cet e-mail car votre adresse a été utilisée pour créer un compte sur <strong>QCMed</strong> .Si vous n’êtes pas à l’origine de cette demande, ignorez-le : aucune action ne sera prise.</p>
        
      </div>
    </div>
  </div>
    `
  });
}
//envoyer un email de remerciment a l'utilisateur 
async function envoyerEmailMerciUtilisateur(emailUser) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd" // ⚠️ mot de passe d’application Gmail
    },
    tls: {
    rejectUnauthorized: false
  },
  secure:true
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',
    to: emailUser,
    subject: 'Merci pour votre signalement - QCMed',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #007BFF, #00C6FF); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">QCMed</h1>
          </div>
          
          <div style="padding: 30px; text-align: center; color: #333;font-weight: bold;">
            <h2 style="color: #007BFF; margin-bottom: 10px;">Merci pour votre signalement</h2>
            <p style="font-size: 16px; line-height: 1.5;">
              Nous avons bien reçu votre signalement.<br>
              Notre équipe va analyser le problème et apporter une correction si nécessaire.
            </p>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              Merci de nous aider à améliorer <strong>QCMed</strong> 
            </p>
          </div>
        </div>
      </div>
    `
  });
}

async function envoyerEmailsignalemet(emailUser, question, reponses, reponsesCorrectes, typeErreur, commentaire) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd"
    },
    tls: {
    rejectUnauthorized: false
  },
  secure:true
    
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',

    to: 'on_hamitouche@esi.dz' ,//email hamzi 

    subject: 'Un signalement pour une faute dans une question ',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
  <div style="max-width: 650px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #007BFF, #00C6FF); padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">QCMed</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px; color: #333;">
      <h2 style="color: #007BFF; margin-bottom: 20px; text-align: center;">Signalement d'erreur</h2>
      
      <!-- Infos générales -->
      <table style="width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        <tr>
          <td style="font-weight: bold; padding: 8px; width: 220px; color: #555;">Utilisateur :</td>
          <td style="padding: 8px;">${emailUser}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="font-weight: bold; padding: 8px; color: #555;">Type d'erreur :</td>
          <td style="padding: 8px;">${typeErreur}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; color: #555;">Commentaire :</td>
          <td style="padding: 8px;">${commentaire || "(aucun)"}</td>
        </tr>
      </table>

      <!-- Bloc question/réponses -->
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #fafafa;">
        <p style="font-size: 16px; margin-bottom: 15px;">
          <b style="color:#007BFF;">Question signalée :</b><br>
          ${question}
        </p>

        <p style="font-size: 16px; margin-bottom: 10px;"><b>Propositions :</b></p>
        <ol style="padding-left: 20px; margin: 0; font-size: 15px; line-height: 1.6;">
          ${reponses.map((rep, i) => `
  <li style="margin-bottom:5px;">
    ${reponsesCorrectes.includes(i) 
      ? `<b style="color:#28a745;">${rep}</b>` 
      : rep}
  </li>
`).join("")}
        </ol>
        
      </div>
    </div>
  </div>
</div>


    `
  });
}




// 🔹 Envoi d'email de validation
async function envoyerEmailValidation(email, id, anneeActuelle, anneeSuivante, token) {
  const today = new Date();
  const annee = today.getFullYear();

  const lienRester = `http://localhost:3000/validation-annee.html?id=${id}&token=${token}&choix=reste`;
  const lienPasser = `http://localhost:3000/validation-annee.html?id=${id}&token=${token}&choix=passe`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd" // mot de passe d’application
    },
    tls: {
    rejectUnauthorized: false
  },
  secure:true
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',
    to: email,
    subject: 'Validation de votre année scolaire - QCMed',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #007BFF, #00C6FF); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">QCMed</h1>
          </div>
          <div style="padding: 30px; text-align: center; font-weight: bold;">
          <h2 style="color: #0077b6; margin-bottom: 10px; font-size: 28px;">Nouvelle étape 🎓</h2>
          <p style="font-size: 18px; color: #333;">
  L’année universitaire <strong>${annee}/${annee+1}</strong> commence bientôt.<br>
  Merci de confirmer si vous passez en <strong>${anneeSuivante}</strong> 
  ou si vous refaites la <strong>${anneeActuelle}</strong>.
</p>

          <div style="margin-top: 25px;">
            <a href="${lienPasser}" style="display: inline-block; background-color: #28a745; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px; font-size: 18px;">
              ✅ Oui, je passe
            </a>

            <a href="${lienRester}" style="display: inline-block; background-color: #dc3545; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px; font-size: 18px;">
              🔄 Non, je refais
            </a>
          </div>
        </div>
        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 14px; color: #666; font-weight: bold;">
          <p>© 2025 QCMed - Tous droits réservés.</p>
        </div>
          
          </div>
        </div>
      </div>
    `
  });
}


async function envoyerEmailConfirmationNouvelle(email, lien) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd"
    },
    tls: {
      rejectUnauthorized: false
    },
    secure: true
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',
    to: email,
    subject: 'Confirmez votre nouvelle adresse e-mail QCMed',
    html: `
     <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- En-tête -->
        <div style="background: linear-gradient(90deg, #0077b6, #00b4d8); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">QCMed</h1>
        </div>

        <!-- Contenu principal -->
        <div style="padding: 30px; text-align: center; font-weight: bold;">
          <h2 style="color: #0077b6; margin-bottom: 10px; font-size: 30px;">Modification d'adresse e-mail</h2>
          <p style="font-size: 20px; color: #333;">Vous avez demandé à changer votre adresse e-mail.</p>
          <p style="font-size: 20px; color: #333;">
            Pour valider cette modification et remplacer votre ancienne adresse par celle-ci, cliquez sur le bouton ci-dessous :
          </p>

          <a href="${lien}" style="display: inline-block; background-color: #0077b6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; font-size: 20px;">
            Activer ma nouvelle adresse
          </a>

          <p style="font-size: 18px; color: #888; margin-top: 20px;">
            Ce lien est valable pendant <strong>24 heures</strong>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 15px; color: #666; font-weight: bold;">
          <p>© 2025 QCMed - Tous droits réservés.</p>
          <p>Vous recevez cet e-mail car vous avez demandé à modifier votre adresse e-mail sur <strong>QCMed</strong>. Si vous n’êtes pas à l’origine de cette demande, ignorez-le : aucune action ne sera prise.</p>
        </div>

      </div>
    </div>
    `
  });
}


async function envoyermailcontact(nom,email, message) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "qcmed.2025@gmail.com",
      pass: "xhvs ezbq mxze qqxd"
    },
    tls: {
      rejectUnauthorized: false
    },
    secure: true
  });

  await transporter.sendMail({
    from: 'QCMed <qcmed.2025@gmail.com>',
    to: "qcmed.2025@gmail.com",
    subject: `Message de ${nom}`,
    
    html: `
     <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
  <div style="max-width: 600px; background: white; margin: auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- En-tête -->
    <div style="background: linear-gradient(90deg, #0077b6, #00b4d8); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">QCMed</h1>
    </div>

    <!-- Contenu principal -->
    <div style="padding: 30px; text-align: left; font-size: 16px; color: #333;">
      <h2 style="color: #0077b6; margin-bottom: 20px; text-align: center;">📩 Nouveau message depuis le formulaire de contact</h2>
      
      <p><strong>Nom :</strong> ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Message :</strong></p>
      <div style="background-color: #f9f9f9; border-left: 4px solid #0077b6; padding: 15px; margin: 15px 0; border-radius: 4px;">
        ${message}
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
        Cet email vous a été envoyé automatiquement par <strong>QCMed</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 14px; color: #666; font-weight: bold;">
      <p>© 2025 QCMed - Tous droits réservés.</p>
    </div>

  </div>
</div>

    `
  });
}




module.exports = {
  envoyerEmailConfirmation,
  envoyerEmailConfirmationcode,
  envoyerEmailsignalemet,
  envoyerEmailMerciUtilisateur,
  envoyerEmailValidation,
  envoyerEmailConfirmationNouvelle,
  envoyermailcontact
  
};
