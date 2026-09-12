"""
Script pour vérifier le contenu de la base de données
"""
import pymysql
from app.config import settings

def check_database():
    """Vérifie le contenu de chaque table"""
    print("=" * 60)
    print("VÉRIFICATION BASE DE DONNÉES")
    print("=" * 60)
    
    # Connexion
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    tables = [
        'vehicules',
        'chauffeurs', 
        'trajets',
        'conges',
        'reclamations',
        'managers',
        'utilisateurs',
        'entreprises'
    ]
    
    try:
        with conn.cursor() as cursor:
            print(f"\n{'TABLE':<20} {'COUNT':<10}")
            print("-" * 30)
            
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                    result = cursor.fetchone()
                    count = result['count']
                    print(f"{table:<20} {count:<10}")
                    
                    # Afficher quelques lignes si la table n'est pas vide
                    if count > 0 and count <= 5:
                        cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                        rows = cursor.fetchall()
                        print(f"  Exemples: {len(rows)} lignes")
                        for row in rows:
                            # Afficher juste les 3 premières colonnes
                            cols = list(row.items())[:3]
                            print(f"    {dict(cols)}")
                    
                except Exception as e:
                    print(f"{table:<20} ERREUR: {str(e)[:50]}")
            
            print("\n" + "=" * 60)
            
            # Test requête spécifique pour vehicules
            print("\nTEST: Requête véhicules sans filtre")
            cursor.execute("SELECT * FROM vehicules LIMIT 5")
            vehicules = cursor.fetchall()
            print(f"Résultat: {len(vehicules)} véhicules trouvés")
            
            if len(vehicules) > 0:
                print(f"Premier véhicule: {vehicules[0]}")
            
    finally:
        conn.close()

if __name__ == "__main__":
    check_database()
