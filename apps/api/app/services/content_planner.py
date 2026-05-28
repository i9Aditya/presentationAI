import re
from dataclasses import dataclass


STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "by", "create", "deck", "for", "from",
    "generate", "in", "include", "make", "of", "on", "ppt", "presentation",
    "report", "slide", "slides", "the", "to", "using", "with",
}


@dataclass
class TopicContext:
    topic: str
    audience: str
    domain: str
    subject: str
    keywords: list[str]
    dataset: str | None = None


class ContentPlanner:
    def plan(self, topic: str, audience: str, count: int, output_type: str) -> list[dict]:
        context = self._context(topic, audience)
        if output_type == "pitch_deck" or context.domain == "startup":
            blueprint = self._pitch_blueprint(context)
        elif context.domain == "cybersecurity":
            blueprint = self._cybersecurity_blueprint(context)
        elif context.domain == "healthcare":
            blueprint = self._healthcare_blueprint(context)
        elif context.domain == "energy":
            blueprint = self._energy_blueprint(context)
        elif context.domain == "education":
            blueprint = self._education_blueprint(context)
        else:
            blueprint = self._general_blueprint(context)
        return self._fit_count(blueprint, count, context)

    def _context(self, topic: str, audience: str) -> TopicContext:
        normalized = re.sub(r"\s+", " ", topic).strip()
        lowered = normalized.lower()
        keywords = self._keywords(normalized)
        dataset_match = re.search(r"\b([A-Z]{2,}[A-Z0-9-]*\d{2,}|CICIDS\d{4}|NSL-KDD|KDDCup99)\b", normalized)
        if any(word in lowered for word in ["intrusion", "ids", "cyber", "malware", "phishing", "network security"]):
            domain = "cybersecurity"
        elif any(word in lowered for word in ["health", "medical", "hospital", "diagnosis", "patient"]):
            domain = "healthcare"
        elif any(word in lowered for word in ["renewable", "solar", "wind", "energy", "grid"]):
            domain = "energy"
        elif any(word in lowered for word in ["education", "student", "learning", "study", "classroom"]):
            domain = "education"
        elif any(word in lowered for word in ["startup", "pitch", "market", "business model", "financial"]):
            domain = "startup"
        else:
            domain = "general"
        subject = self._subject_from_keywords(keywords, normalized)
        return TopicContext(
            topic=normalized,
            audience=audience.replace("_", " "),
            domain=domain,
            subject=subject,
            keywords=keywords,
            dataset=dataset_match.group(1) if dataset_match else None,
        )

    def _keywords(self, topic: str) -> list[str]:
        words = re.findall(r"[A-Za-z0-9][A-Za-z0-9-]{2,}", topic)
        kept = []
        for word in words:
            key = word.lower()
            if key not in STOP_WORDS and key not in kept:
                kept.append(key)
        return kept[:10]

    def _subject_from_keywords(self, keywords: list[str], topic: str) -> str:
        if not keywords:
            return topic
        return " ".join(word.upper() if word.isupper() else word for word in keywords[:4]).title()

    def _fit_count(self, blueprint: list[dict], count: int, context: TopicContext) -> list[dict]:
        if count <= len(blueprint):
            return blueprint[:count]
        extras = []
        for idx in range(count - len(blueprint)):
            focus = context.keywords[idx % len(context.keywords)] if context.keywords else context.subject
            extras.append(self._section(
                f"Deep Dive: {focus.title()}",
                [
                    f"Explain how {focus} changes the practical handling of {context.subject}.",
                    f"Add a concrete example that {context.audience} can discuss or implement.",
                    "Mention one risk, dependency, or measurement that decides success.",
                    "Connect the detail back to the main recommendation of the deck.",
                ],
                f"Use this optional deep-dive slide only if the audience needs more detail on {focus}.",
            ))
        return blueprint + extras

    def _section(self, title: str, bullets: list[str], notes: str, visual: dict | None = None) -> dict:
        payload = {"title": title, "bullets": bullets, "speaker_notes": notes}
        if visual:
            payload["visual"] = visual
        return payload

    def _cybersecurity_blueprint(self, c: TopicContext) -> list[dict]:
        dataset = c.dataset or "the selected network traffic dataset"
        return [
            self._section(
                f"{c.subject}: Context and Goal",
                [
                    f"Position {c.subject} as a way to identify suspicious network behavior before damage spreads.",
                    f"Use {dataset} to connect theory with realistic traffic patterns and labelled attack classes.",
                    f"Focus the deck on detection logic, model workflow, evaluation, and deployment readiness.",
                    f"Target explanation depth for {c.audience}, balancing concepts with implementation details.",
                ],
                f"Open by stating what intrusion detection solves and why {dataset} makes the topic concrete.",
            ),
            self._section(
                "Threat Landscape and Problem Statement",
                [
                    "Modern networks face denial-of-service, brute-force, botnet, infiltration, and web attack patterns.",
                    "Signature-only systems miss unknown or slightly modified attacks, creating a need for adaptive detection.",
                    "High false positives can overwhelm analysts, so accuracy and interpretability both matter.",
                    f"The problem is to classify benign and malicious traffic reliably using features from {dataset}.",
                ],
                "Explain the operational pain: too many alerts, evolving attacks, and the need for measurable detection quality.",
            ),
            self._section(
                "Dataset Understanding",
                [
                    f"{dataset} represents captured network flows with labels that separate benign traffic from attack categories.",
                    "Useful features often include flow duration, packet counts, byte rates, flags, and inter-arrival timing.",
                    "Preprocessing must handle missing values, class imbalance, duplicate rows, and feature scaling.",
                    "Train-test separation should avoid leakage so reported accuracy reflects real generalization.",
                ],
                f"Walk through what a row in {dataset} means and why preprocessing affects the credibility of results.",
                {"type": "table"},
            ),
            self._section(
                "Detection Pipeline Architecture",
                [
                    "Capture traffic flows, clean the feature table, train a classifier, and score incoming flows.",
                    "Use feature selection to reduce noise and improve speed without hiding important attack signals.",
                    "Send high-risk events to dashboards or SIEM tools for analyst review and response.",
                    "Log model decisions so the system can be audited and retrained after drift.",
                ],
                "Describe the pipeline as an end-to-end engineering system, not just a machine learning model.",
                {"type": "diagram"},
            ),
            self._section(
                "Modeling Approach",
                [
                    "Compare baseline algorithms such as decision tree, random forest, SVM, logistic regression, and neural networks.",
                    "Use precision, recall, F1-score, confusion matrix, and ROC-AUC rather than accuracy alone.",
                    "Prioritize recall for severe attacks while managing false positives for analyst workload.",
                    "Tune thresholds based on risk tolerance, not only default classifier output.",
                ],
                "Show that model choice is tied to security trade-offs: missed attacks versus noisy alerts.",
                {"type": "chart"},
            ),
            self._section(
                "Evaluation and Findings",
                [
                    "Report per-class performance because rare attack categories can be hidden by aggregate scores.",
                    "Use confusion matrix insights to identify which attacks are commonly mistaken as benign.",
                    "Compare training and validation performance to detect overfitting.",
                    "Translate metrics into operational meaning: faster triage, fewer missed threats, and clearer escalation.",
                ],
                "Make this slide evidence-led. If actual results are not available, mark the chart as illustrative and replace later.",
                {"type": "chart"},
            ),
            self._section(
                "Deployment Considerations",
                [
                    "Place the detector near network sensors or flow collectors where it can receive timely traffic features.",
                    "Monitor model drift because normal traffic patterns change across semesters, offices, or cloud workloads.",
                    "Protect logs and datasets because they may expose infrastructure details.",
                    "Plan periodic retraining and analyst feedback loops to keep detections relevant.",
                ],
                "Connect classroom implementation to real deployment constraints: latency, privacy, drift, and maintenance.",
            ),
            self._section(
                "Conclusion and Next Steps",
                [
                    f"{c.topic} is strongest when dataset quality, model evaluation, and operational workflow are treated together.",
                    "The next step is to run experiments, compare classifiers, and document class-wise results.",
                    "Add explainability methods such as feature importance or SHAP for reviewer confidence.",
                    "Extend the work with live traffic testing or integration into a dashboard.",
                ],
                "Close by summarizing the complete story: threat problem, dataset, model pipeline, evaluation, and deployment.",
            ),
        ]

    def _healthcare_blueprint(self, c: TopicContext) -> list[dict]:
        return [
            self._section(f"{c.subject}: Why It Matters", [
                f"Show how {c.topic} can improve speed, consistency, and decision support in clinical workflows.",
                "Separate patient-facing benefits from hospital operations and research benefits.",
                "Emphasize that AI supports professionals rather than replacing clinical accountability.",
                f"Use examples that are understandable for {c.audience}.",
            ], "Open with a concrete healthcare workflow such as triage, diagnosis support, or hospital resource planning."),
            self._section("Key Use Cases", [
                "Medical imaging assistance can flag suspicious regions for radiologist review.",
                "Predictive analytics can identify readmission risk, disease progression, or ICU deterioration.",
                "Natural language processing can summarize notes and reduce documentation load.",
                "Chatbots and remote monitoring can support follow-up care when designed safely.",
            ], "Make the use cases specific so the slide does not sound like generic AI marketing."),
            self._section("Data and Model Pipeline", [
                "Collect structured records, images, lab reports, or clinical notes with consent and governance.",
                "Clean and anonymize data before training or fine-tuning models.",
                "Validate on representative patient groups to avoid hidden bias.",
                "Deploy with human review, audit trails, and continuous monitoring.",
            ], "Explain that healthcare AI quality depends on data quality, validation, and responsible deployment.", {"type": "diagram"}),
            self._section("Benefits and Risks", [
                "Benefits include faster screening, better prioritization, and more consistent documentation.",
                "Risks include bias, hallucination, privacy leakage, and over-reliance on automation.",
                "Clinical safety requires explainability, escalation paths, and clear responsibility.",
                "Regulatory and ethical review must be included before real patient use.",
            ], "Balance opportunity with constraints so the deck feels credible.", {"type": "table"}),
            self._section("Implementation Roadmap", [
                "Start with a narrow workflow and define the clinical metric to improve.",
                "Run retrospective validation before live pilot testing.",
                "Train staff on when to trust, question, or override AI recommendations.",
                "Use feedback loops to improve the model and workflow together.",
            ], "Present this as a practical staged adoption plan."),
            self._section("Conclusion", [
                f"{c.topic} creates value when it is safe, validated, explainable, and integrated into real workflows.",
                "The strongest projects combine technical performance with clinical governance.",
                "Future work can explore local datasets, model comparison, or prototype dashboards.",
                "End with the measurable outcome the presentation recommends improving.",
            ], "Close with a grounded takeaway rather than a broad claim."),
        ]

    def _energy_blueprint(self, c: TopicContext) -> list[dict]:
        return [
            self._section(f"{c.subject}: Energy Transition Context", [
                f"Connect {c.topic} to decarbonization, energy security, and rising electricity demand.",
                "Explain the role of solar, wind, hydro, storage, and smart grids.",
                "Use local context such as India’s renewable targets and grid variability where relevant.",
                "Frame the topic as both a technology and policy challenge.",
            ], "Open by explaining why renewable energy is urgent and practical."),
            self._section("Technology Mix", [
                "Solar offers modular deployment but depends on daylight and land availability.",
                "Wind can produce large-scale power but varies by location and season.",
                "Storage, forecasting, and grid upgrades help manage intermittency.",
                "Hybrid renewable systems improve reliability compared with single-source systems.",
            ], "Compare technologies with trade-offs instead of listing definitions.", {"type": "table"}),
            self._section("Cost and Adoption Trends", [
                "Falling module and turbine costs have improved renewable competitiveness.",
                "Transmission, storage, and balancing costs still affect total system economics.",
                "Policy incentives and procurement models influence adoption speed.",
                "Community acceptance and land-use planning shape project feasibility.",
            ], "Make the economics concrete and connect them to adoption decisions.", {"type": "chart"}),
            self._section("Implementation Roadmap", [
                "Assess resource availability, demand profile, land, finance, and grid connection.",
                "Design a mix of generation, storage, monitoring, and maintenance processes.",
                "Use forecasting and smart controls to reduce curtailment and outages.",
                "Track performance through capacity factor, cost per kWh, and emissions avoided.",
            ], "Walk through how a renewable project moves from idea to operation.", {"type": "diagram"}),
            self._section("Challenges and Solutions", [
                "Intermittency requires storage, flexible demand, and better forecasting.",
                "Grid congestion requires transmission planning and local balancing.",
                "Financing risks can be reduced through clear policy and bankable contracts.",
                "Skill development is needed for installation, operation, and maintenance.",
            ], "Pair each challenge with a practical response."),
            self._section("Conclusion", [
                f"{c.topic} is viable when technology, policy, finance, and grid readiness align.",
                "The next decade depends on storage, smarter grids, and implementation capacity.",
                "Students can extend the work through case studies, cost analysis, or prototype monitoring systems.",
                "Close with the key action needed for adoption in the chosen context.",
            ], "End with a clear, actionable summary."),
        ]

    def _education_blueprint(self, c: TopicContext) -> list[dict]:
        return [
            self._section(f"{c.subject}: Learning Context", [
                f"Explain how {c.topic} affects student learning, teacher workload, and assessment quality.",
                "Identify the learner group, pain point, and expected improvement.",
                "Separate personalization, analytics, content generation, and tutoring use cases.",
                "Keep the focus on learning outcomes rather than technology novelty.",
            ], "Open from the perspective of a student or teacher workflow."),
            self._section("Use Cases", [
                "Adaptive practice can adjust difficulty based on learner performance.",
                "AI tutors can provide hints, explanations, and revision planning.",
                "Analytics can identify students who need intervention earlier.",
                "Content tools can help teachers create quizzes, summaries, and lesson material faster.",
            ], "Use recognizable classroom examples."),
            self._section("System Workflow", [
                "Collect learner goals, syllabus, performance data, and feedback.",
                "Generate or recommend content aligned with the curriculum.",
                "Track progress and adapt the next learning activity.",
                "Keep teacher review and student privacy controls in the loop.",
            ], "Explain the system as a loop of diagnosis, recommendation, practice, and feedback.", {"type": "diagram"}),
            self._section("Benefits and Limitations", [
                "Benefits include personalization, faster feedback, and better revision planning.",
                "Limitations include hallucinated content, bias, distraction, and privacy concerns.",
                "Quality improves when AI output is tied to syllabus, rubrics, and teacher review.",
                "Evaluation should measure learning gains, engagement, and fairness.",
            ], "Make the slide balanced and credible.", {"type": "table"}),
            self._section("Conclusion", [
                f"{c.topic} works best as a guided learning support system, not a shortcut.",
                "The most important design choice is aligning AI help with measurable learning outcomes.",
                "Future work can include pilot testing, student feedback, or dashboard prototypes.",
                "End with one recommendation for responsible classroom use.",
            ], "Close with responsible use and measurable impact."),
        ]

    def _pitch_blueprint(self, c: TopicContext) -> list[dict]:
        return [
            self._section("Problem", [
                f"Define the urgent customer pain behind {c.topic}.",
                "Describe who feels the pain, how often it occurs, and why current alternatives fall short.",
                "Quantify the impact using time, money, risk, or missed opportunity.",
                "Frame the problem in one sentence investors can remember.",
            ], "Start with the customer pain, not the product."),
            self._section("Solution", [
                f"Present {c.subject} as a focused solution to the stated problem.",
                "Explain the core workflow in three steps: onboard, use, and measure value.",
                "Highlight what is meaningfully better than existing alternatives.",
                "Keep technical details tied to customer benefit.",
            ], "Make the solution feel specific and usable.", {"type": "diagram"}),
            self._section("Market Opportunity", [
                "Define the beachhead segment before expanding to broader market potential.",
                "Show why the segment has budget, urgency, and repeat usage.",
                "Mention adoption drivers such as regulation, cost pressure, or behavior change.",
                "Use TAM/SAM/SOM placeholders only if verified values are not available yet.",
            ], "Ask the user to replace market numbers with verified research before pitching.", {"type": "chart"}),
            self._section("Business Model", [
                "Explain pricing, buyer, user, and renewal logic clearly.",
                "Show how customer acquisition cost can be recovered through retention or expansion.",
                "Identify the main revenue stream and one future expansion path.",
                "Connect pricing to measurable value delivered.",
            ], "Make business mechanics clear enough for a first investor conversation.", {"type": "table"}),
            self._section("Go-To-Market", [
                "Start with one reachable customer segment and one repeatable acquisition channel.",
                "Use pilots, campus/community partnerships, or founder-led sales to validate demand.",
                "Track conversion, activation, retention, and referral metrics.",
                "Expand only after evidence of repeatable usage and willingness to pay.",
            ], "Focus on sequence and evidence."),
            self._section("Roadmap and Ask", [
                "List the next product milestones and validation experiments.",
                "State what resources are needed: funding, partners, pilots, or technical support.",
                "Define how success will be measured over the next 3 to 6 months.",
                "End with a specific ask and clear next step.",
            ], "Close with momentum and a precise ask."),
        ]

    def _general_blueprint(self, c: TopicContext) -> list[dict]:
        return [
            self._section(f"{c.subject}: Overview", [
                f"Define {c.topic} in simple terms before moving into details.",
                f"Explain why the topic matters to {c.audience}.",
                "Identify the main components, stakeholders, or concepts involved.",
                "Preview the evidence, workflow, and recommendations covered in the deck.",
            ], "Open with a definition, relevance, and roadmap."),
            self._section("Problem and Motivation", [
                f"Describe the gap, challenge, or opportunity that makes {c.topic} important.",
                "Mention who is affected and what happens if the issue is ignored.",
                "Separate causes from symptoms so the audience can follow the logic.",
                "Use one realistic example to ground the discussion.",
            ], "Make the problem concrete."),
            self._section("Core Concepts", [
                f"Break {c.subject} into the main ideas needed to understand the topic.",
                "Explain technical terms in audience-friendly language.",
                "Show how the concepts connect rather than listing them separately.",
                "Use a diagram or example where relationships matter.",
            ], "Teach the necessary concepts before analysis.", {"type": "diagram"}),
            self._section("Analysis and Evidence", [
                "Summarize the strongest evidence or reasoning supporting the main point.",
                "Compare alternatives, trade-offs, or before-after conditions.",
                "Identify assumptions and limitations clearly.",
                "Translate findings into practical meaning for the audience.",
            ], "Keep this slide evidence-led.", {"type": "chart"}),
            self._section("Implementation or Application", [
                f"Show how {c.topic} can be applied in a realistic setting.",
                "List the steps, resources, people, and constraints involved.",
                "Mention risks and how they can be controlled.",
                "Define success metrics for judging the application.",
            ], "Move from theory to action."),
            self._section("Conclusion and Recommendations", [
                f"Restate the main takeaway about {c.topic}.",
                "Prioritize the most practical recommendation.",
                "Name the next step for study, implementation, or decision-making.",
                "End with a concise closing message.",
            ], "Close with clarity and direction."),
        ]
