async send() {
        if (!this.msg || this.invalid) return

        // 🛑 Lógica EXTREMA para forzar el canal de envío 🛑
        
        // 1. ID de tu canal
        const ID_CANAL_OBJETIVO = "1429465758160912495"; 
        
        let ch;

        // Intentar obtener el canal POR ID (Única lógica)
        if (ID_CANAL_OBJETIVO) {
            ch = await this.userMessage.guild.channels.fetch(ID_CANAL_OBJETIVO).catch((e) => {
                console.error("Fallo al buscar el canal:", e);
            });
        } 
        
        // Si el canal se encontró, enviar el mensaje
        if (ch && ch.id) {
             ch.send(this.msg).catch((e) => {
                 // Si falla al enviar, lo logueamos, pero ya no intentamos enviar otro mensaje de error
                 console.error(`Fallo al enviar el mensaje al canal ${ID_CANAL_OBJETIVO}:`, e);
             });
        } else {
             console.log(`El canal objetivo ${ID_CANAL_OBJETIVO} no se pudo encontrar o es inválido.`);
        }
        
    }
