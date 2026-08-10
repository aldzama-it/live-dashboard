import pymysql
import pandas as pd
import re
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# DB Config
DB_HOST = '127.0.0.1'
DB_USER = 'root'
DB_PASS = ''
DB_NAME = 'dashboard_all_division'

def connect_db():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

def remove_pii(text):
    if not isinstance(text, str):
        return ""
    # Remove emails
    text = re.sub(r'\S+@\S+', '[EMAIL]', text)
    # Remove indonesian phone numbers (e.g. 0812..., +62...)
    text = re.sub(r'(\+62|62|0)[0-9]{9,12}', '[PHONE]', text)
    return text

def clean_text(text):
    text = str(text).lower()
    # Remove non-alphanumeric except spaces
    text = re.sub(r'[^a-z\s]', ' ', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def process_tickets():
    print("Connecting to DB...")
    connection = connect_db()
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    try:
        with connection.cursor() as cursor:
            # Fetch tickets for this month
            sql = "SELECT id, subject, description FROM it_tickets WHERE MONTH(created_at) = %s AND YEAR(created_at) = %s"
            cursor.execute(sql, (current_month, current_year))
            tickets = cursor.fetchall()
            
            if not tickets:
                print(f"No tickets found for {current_month}/{current_year}. Exiting.")
                return

            print(f"Found {len(tickets)} tickets. Processing...")
            
            # Setup Sastrawi
            stemmer = StemmerFactory().create_stemmer()
            stopword_remover = StopWordRemoverFactory().create_stop_word_remover()
            
            processed_texts = []
            
            for ticket in tickets:
                raw_text = f"{ticket['subject']} {ticket['description']}"
                
                # 1. Remove PII
                text_no_pii = remove_pii(raw_text)
                
                # 2. Clean (lowercase, remove symbols)
                cleaned = clean_text(text_no_pii)
                
                # 3. Stopword Removal
                no_stop = stopword_remover.remove(cleaned)
                
                # 4. Normalization / Stemming
                stemmed = stemmer.stem(no_stop)
                
                processed_texts.append(stemmed)

            # 5. Tokenization, N-gram & TF-IDF
            print("Running TF-IDF with N-grams (1, 3)...")
            vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=50)
            try:
                tfidf_matrix = vectorizer.fit_transform(processed_texts)
            except ValueError:
                # In case vocabulary is empty after stopping
                print("Vocabulary empty. Exiting.")
                return
                
            feature_names = vectorizer.get_feature_names_out()
            
            # Sum TF-IDF scores across all documents
            sums = tfidf_matrix.sum(axis=0)
            data = []
            for col, term in enumerate(feature_names):
                data.append((term, sums[0, col]))
                
            # Sort by score (frequency/importance)
            ranking = pd.DataFrame(data, columns=['term', 'score'])
            ranking = ranking.sort_values('score', ascending=False).head(10)
            
            print("Top Keywords extracted:")
            print(ranking)
            
            # 6. Database Update
            print("Updating database...")
            # Delete old keywords for this month
            del_sql = "DELETE FROM it_ticket_keywords WHERE month = %s AND year = %s"
            cursor.execute(del_sql, (current_month, current_year))
            
            # Insert new keywords
            insert_sql = "INSERT INTO it_ticket_keywords (keyword, frequency, month, year, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), NOW())"
            
            # Scale score to a pseudo-frequency (integer) for the frontend
            max_score = ranking['score'].max() if not ranking.empty else 1
            
            for index, row in ranking.iterrows():
                term = row['term']
                # Convert tfidf score to a simulated frequency percentage or count
                # Since max_score might be small, we multiply to get a visible number
                freq = int((row['score'] / max_score) * 100) if max_score > 0 else 0
                cursor.execute(insert_sql, (term, freq, current_month, current_year))
                
            connection.commit()
            print("Database updated successfully.")
            
    finally:
        connection.close()

if __name__ == "__main__":
    process_tickets()
