from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Core glossary induction mappings across supported languages
DISASTER_GLOSSARY: dict[str, dict[str, str]] = {
    "hi": {
        "Disaster Relief": "आपदा राहत",
        "Emergency": "आपातकालीन",
        "Volunteers": "स्वयंसेवक",
        "Rescue": "बचाव",
        "Flooding": "बाढ़",
        "Cyclone": "चक्रवात",
        "Earthquake": "भूकंप",
        "Critical": "गंभीर",
        "Severe": "अति तीव्र",
        "Warning": "चेतावनी",
        "Available": "उपलब्ध",
        "Deployed": "तैनात",
        "On Standby": "स्टैंडबाय पर",
        "Inducted": "शामिल किया गया",
        "Certified": "प्रमाणित",
        "Food": "भोजन",
        "Water": "पानी",
        "Medical": "चिकित्सा",
        "Shelter": "आश्रय",
        "Incidents": "घटनाएं",
        "Dashboard": "डैशबोर्ड",
        "Alerts": "अलर्ट",
    },
    "ml": {
        "Disaster Relief": "ദുരന്ത നിവാരണം",
        "Emergency": "അടിയന്തിര ഘട്ടം",
        "Volunteers": "സന്നദ്ധപ്രവർത്തകർ",
        "Rescue": "രക്ഷാപ്രവർത്തനം",
        "Flooding": "വെള്ളപ്പൊക്കം",
        "Cyclone": "ചുഴലിക്കാറ്റ്",
        "Earthquake": "ഭൂകമ്പം",
        "Critical": "ഗുരുതരം",
        "Severe": "തീവ്രം",
        "Warning": "മുന്നറിയിപ്പ്",
        "Available": "ലഭ്യമാണ്",
        "Deployed": "വിന്യസിച്ചു",
        "On Standby": "സ്റ്റാൻഡ്ബൈ",
        "Inducted": "പരിശീലിപ്പിച്ചു",
        "Certified": "സാക്ഷ്യപ്പെടുത്തിയത്",
        "Food": "ഭക്ഷണം",
        "Water": "വെള്ളം",
        "Medical": "ചികിത്സ",
        "Shelter": "താമസ സൗകര്യം",
        "Incidents": "സംഭവങ്ങൾ",
        "Dashboard": "ഡാഷ്‌ബോർഡ്",
        "Alerts": "മുന്നറിയിപ്പുകൾ",
    },
    "or": {
        "Disaster Relief": "ବିପର୍ଯ୍ୟୟ ରିଲିଫ୍",
        "Emergency": "ଜରୁରୀକାଳୀନ",
        "Volunteers": "ସ୍ୱେଚ୍ଛାସେବୀ",
        "Rescue": "ଉଦ୍ଧାର କାର୍ଯ୍ୟ",
        "Flooding": "ବନ୍ୟା",
        "Cyclone": "ବାତ୍ୟା",
        "Earthquake": "ଭୂମିକମ୍ପ",
        "Critical": "ଗୁରୁତର",
        "Severe": "ଅତି ତୀବ୍ର",
        "Warning": "ସତର୍କତା",
        "Available": "ଉପଲବ୍ଧ",
        "Deployed": "ନିୟୋଜିତ",
        "On Standby": "ଷ୍ଟାଣ୍ଡବାଏ",
        "Inducted": "ତାଲିମପ୍ରାପ୍ତ",
        "Certified": "ପ୍ରମାଣିତ",
        "Food": "ଖାଦ୍ୟ",
        "Water": "ପାଣି",
        "Medical": "ଚିକିତ୍ସା",
        "Shelter": "ଆଶ୍ରୟସ୍ଥଳୀ",
        "Incidents": "ଘଟଣାଗୁଡ଼ିକ",
        "Dashboard": "ଡ୍ୟାସବୋର୍ଡ",
        "Alerts": "ସତର୍କ ସୂଚନା",
    },
    "es": {
        "Disaster Relief": "Socorro en Desastres",
        "Emergency": "Emergencia",
        "Volunteers": "Voluntarios",
        "Rescue": "Rescate",
        "Flooding": "Inundación",
        "Cyclone": "Ciclón",
        "Earthquake": "Terremoto",
        "Critical": "Crítico",
        "Severe": "Severo",
        "Warning": "Advertencia",
        "Available": "Disponible",
        "Deployed": "Desplegado",
        "On Standby": "En Espera",
        "Inducted": "Inducido",
        "Certified": "Certificado",
        "Food": "Alimentos",
        "Water": "Agua",
        "Medical": "Médico",
        "Shelter": "Refugio",
        "Incidents": "Incidentes",
        "Dashboard": "Panel",
        "Alerts": "Alertas",
    },
    "fr": {
        "Disaster Relief": "Secours aux Sinistrés",
        "Emergency": "Urgence",
        "Volunteers": "Bénévoles",
        "Rescue": "Sauvetage",
        "Flooding": "Inondation",
        "Cyclone": "Cyclone",
        "Earthquake": "Séisme",
        "Critical": "Critique",
        "Severe": "Sévère",
        "Warning": "Avertissement",
        "Available": "Disponible",
        "Deployed": "Déployé",
        "On Standby": "En Réserve",
        "Inducted": "Intronisé",
        "Certified": "Certifié",
        "Food": "Nourriture",
        "Water": "Eau",
        "Medical": "Médical",
        "Shelter": "Abri",
        "Incidents": "Incidents",
        "Dashboard": "Tableau de Bord",
        "Alerts": "Alertes",
    }
}


class TranslationInductRequest(BaseModel):
    text: str
    target_lang: str = "hi"
    source_lang: str = "en"


class TranslationInductResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    glossary_terms_matched: list[str]


@router.get("/{lang}")
async def get_translations_dictionary(lang: str):
    return {
        "lang": lang,
        "terms": DISASTER_GLOSSARY.get(lang.lower(), DISASTER_GLOSSARY.get("hi", {}))
    }


@router.post("/induct", response_model=TranslationInductResponse)
async def induct_translation(payload: TranslationInductRequest):
    glossary = DISASTER_GLOSSARY.get(payload.target_lang.lower(), {})
    translated = payload.text
    matched = []

    for en_term, target_term in glossary.items():
        if en_term.lower() in translated.lower():
            # Case-insensitive replacement while retaining context
            import re
            pattern = re.compile(re.escape(en_term), re.IGNORECASE)
            translated = pattern.sub(target_term, translated)
            matched.append(en_term)

    return TranslationInductResponse(
        original_text=payload.text,
        translated_text=translated,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
        glossary_terms_matched=matched,
    )
