from app.report_analyzer import ReportRequestAnalyzer

a = ReportRequestAnalyzer()

tests = [
    'Liste TXT de tous les trajets',
    'Rapport PDF de tous les congés',
]

for req in tests:
    result = a.analyze(req, 'PDF')
    print(f'Requête: {req}')
    print(f'  Domaine détecté: {result["domaine"]}')
    print()
