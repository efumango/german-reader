import json

# Must download the JSON file from https://kaikki.org/dictionary/German/index.html, rename it to kaikki.json and put it into this folder first 

# Paths to the input JSON file and the output text files
input_file_path = 'kaikki.json'
intermediate_file_path = 'output_intermediate.txt'
final_output_file_path = 'output_final.txt'

def process_entry(entry):
    word = entry.get('word', '')
    glosses_list = entry.get('senses', [])[0].get('glosses', [])  # Extract the first sense
    glosses = ', '.join(glosses_list)  # Join all glosses into a single string, separated by commas
    
    # Attempt to extract the 'form_of' word from the first sense if it exists
    form_of_words = [form.get('word', '') for form in entry.get('senses', [])[0].get('form_of', [])]
    form_of = ', '.join(form_of_words)  # Join all 'form_of' words into a single string, separated by commas

    return f"{word}\t{form_of}\t{glosses}\n"

def write_intermediate_file():
    with open(intermediate_file_path, 'w', encoding='utf-8') as txt_file:
        with open(input_file_path, 'r', encoding='utf-8') as json_file:
            for line in json_file:
                try:
                    entry = json.loads(line)
                    txt_file.write(process_entry(entry))
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON: {e}")
                    continue  # Skip lines that cannot be parsed as JSON
    print("Data has been successfully exported to the intermediate text file.")

def consolidate_inflections():
    current_entry = []
    inflections = []
    processed_entries = []

    with open(intermediate_file_path, 'r', encoding='utf-8') as file:
        for line in file:
            line = line.strip()
            if line.startswith('##'):
                inflections.append(line)
            else:
                if current_entry:
                    current_entry.append(' '.join(inflections))
                    processed_entries.append('\t'.join(current_entry))
                    current_entry = []
                    inflections = []
                current_entry = line.split('\t')

    if current_entry:
        current_entry.append(' '.join(inflections))
        processed_entries.append('\t'.join(current_entry))

    with open(final_output_file_path, 'w', encoding='utf-8') as out_file:
        for entry in processed_entries:
            out_file.write(entry + '\n')

    print("File has been processed. Each entry's ## lines are now consolidated into the same column.")

def main():
    write_intermediate_file()
    consolidate_inflections()

if __name__ == "__main__":
    main()
