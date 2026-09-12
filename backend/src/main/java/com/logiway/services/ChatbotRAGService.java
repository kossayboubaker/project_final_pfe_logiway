package com.logiway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotRAGService {

    private final ChatbotToolsService chatbotToolsService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    /**
     * Exécute les outils nécessaires selon les questions posées.
     */
    public String executeOutils(List<String> questions, String utilisateur, Long entrepriseId) {
        StringBuilder resultBuilder = new StringBuilder();

        // Définir la période de recherche par défaut
        LocalDate dateFin = LocalDate.now();
        LocalDate dateDebut = dateFin.minusMonths(1);

        for (String question : questions) {
            String q = question.toLowerCase();

            if (q.contains("utilisateur") || q.contains("statistique") || q.contains("global")) {
                resultBuilder.append(chatbotToolsService.getStatistiquesGlobales(entrepriseId)).append("\n");
            }
            if (q.contains("congé") || q.contains("conge") || q.contains("absence") || q.contains("permission")) {
                if (q.contains("attente") || q.contains("en attente") || q.contains("validation")) {
                    resultBuilder.append(chatbotToolsService.getCongesEnAttente(null)).append("\n");
                } else if (q.contains("semaine") || q.contains("cette semaine")) {
                    resultBuilder.append(chatbotToolsService.getCongesSemaine()).append("\n");
                } else if (q.contains("rapport") || q.contains("période") || q.contains("periode")) {
                    resultBuilder.append(chatbotToolsService.getRapportCongesParPeriode(dateDebut, dateFin, entrepriseId)).append("\n");
                }
            }
            if (q.contains("réclamation") || q.contains("reclamation") || q.contains("réclamer") || q.contains("plainte")) {
                if (q.contains("ouvert") || q.contains("priorité") || q.contains("priorite")) {
                    resultBuilder.append(chatbotToolsService.getReclamationsOuvertes()).append("\n");
                } else if (q.contains("résumé") || q.contains("resume") || q.contains("statut")) {
                    resultBuilder.append(chatbotToolsService.getResumeReclamations(entrepriseId)).append("\n");
                }
            }
            if (q.contains("véhicule") || q.contains("vehicule") || q.contains("voiture") || q.contains("maintenance") || q.contains("panne")) {
                if (q.contains("maintenance") || q.contains("panne") || q.contains("réparation") || q.contains("reparation")) {
                    resultBuilder.append(chatbotToolsService.getVehiculesEnMaintenance(entrepriseId)).append("\n");
                } else {
                    resultBuilder.append(chatbotToolsService.getRapportVehicules(entrepriseId)).append("\n");
                }
            }
            if (q.contains("chauffeur") || q.contains("conducteur") || q.contains("disponible")) {
                resultBuilder.append(chatbotToolsService.getChauffeursDisponibles(entrepriseId)).append("\n");
            }
            if (q.contains("trajet") || q.contains("livraison") || q.contains("transport") || q.contains("course")) {
                if (q.contains("cours") || q.contains("actif")) {
                    resultBuilder.append(chatbotToolsService.getTrajetsEnCoursParSecteur(entrepriseId)).append("\n");
                } else if (q.contains("rapport") || q.contains("période") || q.contains("periode") || q.contains("statistique")) {
                    resultBuilder.append(chatbotToolsService.getRapportTrajets(dateDebut, dateFin, entrepriseId)).append("\n");
                }
            }
            if (q.contains("taux") && (q.contains("absence") || q.contains("absenteisme") || q.contains("absentéisme"))) {
                int mois = dateFin.getMonthValue();
                int annee = dateFin.getYear();
                resultBuilder.append(chatbotToolsService.getTauxAbsencesChauffeurs(mois, annee, entrepriseId)).append("\n");
            }
        }

        String result = resultBuilder.toString().trim();
        return result.isEmpty() ? "Aucune donnée trouvée pour cette question." : result;
    }

    /**
     * Génère et exécute une requête SQL à partir d'une question en langage naturel
     * Note: Cette méthode est maintenant dépréciée, utilisez plutôt le service RAG Gemini
     */
    public String generateSql(String question) {
        log.warn("La génération SQL via Ollama est dépréciée. Utilisez le service RAG Gemini pour des réponses plus précises.");
        
        // Retourne un message indiquant d'utiliser le chatbot RAG
        return "La génération SQL automatique n'est plus disponible via cette méthode.\n" +
               "Veuillez poser votre question directement au chatbot RAG Gemini qui vous fournira " +
               "une réponse précise basée sur les données de votre système.";
    }

    /**
     * Nettoie la réponse Ollama pour extraire uniquement la requête SQL
     */
    private String nettoyerSql(String sql) {
        if (sql == null || sql.isEmpty()) return "";

        // Enlever les marqueurs markdown ```sql ... ```
        sql = sql.replaceAll("```sql\\s*", "");
        sql = sql.replaceAll("```\\s*", "");

        // Enlever les lignes avant SELECT/ WITH/ SHOW
        int selectIndex = sql.toUpperCase().indexOf("SELECT");
        int withIndex = sql.toUpperCase().indexOf("WITH");
        int showIndex = sql.toUpperCase().indexOf("SHOW");

        int startIndex = -1;
        if (selectIndex >= 0) startIndex = selectIndex;
        if (withIndex >= 0 && (startIndex < 0 || withIndex < startIndex)) startIndex = withIndex;
        if (showIndex >= 0 && (startIndex < 0 || showIndex < startIndex)) startIndex = showIndex;

        if (startIndex >= 0) {
            sql = sql.substring(startIndex);
        }

        // Enlever la partie après le point-virgule (et garder le point-virgule)
        int semicolonIndex = sql.indexOf(';');
        if (semicolonIndex >= 0) {
            sql = sql.substring(0, semicolonIndex + 1);
        }

        return sql.trim();
    }

    /**
     * Traite une question utilisateur via le pipeline MCP complet avec Gemini RAG
     */
    public String traiterQuestion(String question, String utilisateur) {
        try {
            // Étape 1: Détection des entités et extraction des questions
            List<String> questions = detecterQuestions(question);

            // Étape 2: Exécution des outils MCP pour récupérer les données
            String donneesOutils = executeOutils(questions, utilisateur, null);

            // Étape 3: Utilisation du service RAG Gemini
            log.debug("Envoi de la question au service RAG Gemini");
            
            // On passe les données des outils pour une réponse hybride
            return geminiService.traiterQuestionHybride(question, utilisateur, null, donneesOutils);

        } catch (Exception e) {
            log.error("Erreur pipeline RAG: {}", e.getMessage(), e);
            return "Désolé, une erreur est survenue lors du traitement de votre demande.";
        }
    }

    /**
     * Détecte les questions sous-jacentes à partir d'une question utilisateur
     */
    private List<String> detecterQuestions(String question) {
        List<String> questions = new ArrayList<>();
        questions.add(question);

        String q = question.toLowerCase();

        // Détection des thèmes pour déclencher les outils appropriés
        if (q.contains("tous") || q.contains("tout") || q.contains("global") || q.contains("résumé") || q.contains("resume") || q.contains("statut")) {
            questions.add("global");
        }

        if (q.contains("maintenance") || q.contains("panne") || q.contains("entretien")) {
            questions.add("maintenance");
        }

        if (q.contains("absent") || q.contains("taux") && q.contains("absence")) {
            questions.add("taux absence");
        }

        return questions;
    }

    /**
     * Construit le prompt enrichi pour Ollama
     */
    private String construirePrompt(String question, String utilisateur, String donneesOutils) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Tu es LogiWay Assistant, un assistant intelligent de gestion de flotte automobile. ");
        promptBuilder.append("Tu aides les gestionnaires de flotte et les chauffeurs dans leur travail quotidien.\n\n");

        promptBuilder.append("INFORMATIONS CLÉS:\n");
        promptBuilder.append("- Gestion de flotte: véhicules, chauffeurs, trajets, congés, réclamations, maintenance\n");
        promptBuilder.append("- Les données système sont fournies ci-dessous\n");
        promptBuilder.append("- Tu dois répondre en français naturel et concis\n");
        promptBuilder.append("- Max 5 lignes de réponse, va à l'essentiel\n");
        promptBuilder.append("- Si les données ne permettent pas de répondre, dis-le clairement\n\n");

        promptBuilder.append("Utilisateur: ").append(utilisateur).append("\n\n");

        if (!donneesOutils.isEmpty() && !donneesOutils.equals("Aucune donnée trouvée pour cette question.")) {
            promptBuilder.append("Données disponibles dans le système :\n");
            promptBuilder.append(donneesOutils);
            promptBuilder.append("\n\n");
        }

        promptBuilder.append("Question de l'utilisateur :\n").append(question).append("\n\n");
        promptBuilder.append("Réponse :");

        return promptBuilder.toString();
    }
}
