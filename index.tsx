import { findByProps } from "@vendetta/metro";
import { logger } from "@vendetta/utils";
import { registerCommand } from "@vendetta/commands";
import { wrap } from "@vendetta/patcher";

// Gerekli modülleri bulalım
const VoiceStateUpdate = findByProps("voiceStateUpdate");
const MediaEngineStore = findByProps("isDeaf", "isMute");
const SelectedChannelStore = findByProps("getVoiceChannelId");

let fakeDeafenEnabled = false;
let unpatch;

export default {
    name: "RevengeFakeDeafen",
    description: "Android Revenge modu için Fake Deafen/Mute.",
    authors: [{ name: "hyyven", id: 449282863582412850n }],

    onLoad() {
        // 1. Fonksiyonel Mantığı Yamalayalım
        if (VoiceStateUpdate) {
            unpatch = wrap(VoiceStateUpdate, "voiceStateUpdate", function (args, orig) {
                if (fakeDeafenEnabled && args[0]) {
                    // Sunucuya 'sağır' ve 'sessiz' olduğumuzu söylüyoruz
                    args[0].selfMute = true;
                    args[0].selfDeaf = true;
                }
                return orig.apply(this, args);
            });
        }

        // 2. Android için Komut Ekleme (Mobilde buton eklemek zordur, komut daha stabildir)
        registerCommand({
            name: "fakedeafen",
            description: "Fake Deafen modunu açar/kapatır.",
            execute: (args, ctx) => {
                fakeDeafenEnabled = !fakeDeafenEnabled;
                
                // Durumu güncellemek için mevcut ses kanalına paket gönder
                const channelId = SelectedChannelStore.getVoiceChannelId();
                if (channelId) {
                    VoiceStateUpdate.voiceStateUpdate({
                        channelId: channelId,
                        selfMute: fakeDeafenEnabled || MediaEngineStore.isMute(),
                        selfDeaf: fakeDeafenEnabled || MediaEngineStore.isDeaf()
                    });
                }

                return { content: `Revenge: Fake Deafen şu an **${fakeDeafenEnabled ? "AKTİF" : "KAPALI"}**` };
            }
        });
    },

    onUnload() {
        if (unpatch) unpatch();
        fakeDeafenEnabled = false;
    }
};
