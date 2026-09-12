import requests

r = requests.post('http://localhost:5003/api/reports/generate', json={
    'requete_naturelle': 'Liste de toutes les réclamations',
    'format_prefere': 'CSV',
    'user_id': '1',
    'entreprise_id': '1'
})

print(f'Status: {r.status_code}')
data = r.json()
print(f'Success: {data.get("success")}')
print(f'Message: {data.get("message")}')
if data.get('metadata'):
    meta = data['metadata']
    print(f'Domaine: {meta.get("domaine")}')
    print(f'Format: {meta.get("format")}')
    print(f'Lignes: {meta.get("nb_lignes")}')
