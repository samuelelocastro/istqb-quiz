import re
import os
import json

base_dir = r"C:\Users\USER\.gemini\antigravity\brain\51dc7147-d36a-442c-a96c-966aa1e57231\scratch"
exams = ['A', 'B', 'C', 'D']

def clean_text(text):
    text = text.replace("â€˜", "'").replace("â€™", "'").replace("Ã¨", "è").replace("Ã", "à")
    text = text.replace("‘", "'").replace("’", "'")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_questions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    questions = {}
    current_q = None
    q_text = []
    options = []
    current_opt = None
    opt_text = []

    def save_opt():
        nonlocal current_opt, opt_text
        if current_opt:
            options.append((current_opt, clean_text(' '.join(opt_text))))
        current_opt = None
        opt_text = []

    def save_q():
        nonlocal current_q, q_text, options
        save_opt()
        if current_q:
            questions[current_q] = {
                'q': clean_text('\n'.join(q_text)),
                'o': options
            }
        current_q = None
        q_text = []
        options = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith('<<<PAGE_BREAK>>>') or line.startswith('Certified Tester') or line.startswith('Simulazione') or line.startswith('Versione') or line.startswith('©') or line.startswith('Pagina') or line.startswith('27 Maggio') or line.startswith('Indice dei') or line.startswith('Domande') or line.startswith('Introduzione'):
            continue
            
        m = re.match(r'^Domanda\s+([A-Z0-9]+)\s*\(1 punto\)', line, re.IGNORECASE)
        if m:
            save_q()
            current_q = m.group(1).upper()
            continue
            
        if not current_q:
            continue
            
        if line.startswith('Selezionare UNA') or line.startswith('Selezionare DUE'):
            save_q()
            continue
            
        m_opt = re.match(r'^([a-e])\)\s*(.*)', line, re.IGNORECASE)
        if m_opt:
            save_opt()
            current_opt = m_opt.group(1).lower()
            opt_text.append(m_opt.group(2))
        else:
            if current_opt:
                opt_text.append(line)
            else:
                q_text.append(line)
    save_q()
    return questions

def parse_solutions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The solutions have a summary table at the start, and then detailed explanations.
    # The summary table might be easier to parse:
    # "Numero domanda (#) | Risposta corretta | LO | Livello K | Punti"
    
    sols = {}
    
    # Try to find the summary table lines
    # Format: <number> \n <answer> \n <LO> \n <K> \n <points>
    # Wait, the summary table in the text might just be columns. Let's rely on the detailed section which has:
    # <number> \n <answer> \n a) ... \n b) ... \n c) ... \n d) ... \n <LO> \n <K> \n <points>
    
    # Actually, a simple regex on the text to find "FL-X.X.X" and backtrack might work.
    # Or just parse the detailed section block by block.
    
    lines = content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Look for a standalone question number, then answer, then explanation starting with a)
        if re.match(r'^([A-Z0-9]+)$', line):
            q_num = line
            i += 1
            if i < len(lines):
                ans_line = lines[i].strip()
                if re.match(r'^[a-e](,\s*[a-e])*$', ans_line):
                    # We might have found a detailed block
                    ans = ans_line
                    expl = []
                    i += 1
                    lo = "FL-0.0.0"
                    while i < len(lines) and not re.match(r'^FL-\d+\.\d+\.\d+', lines[i].strip()):
                        if lines[i].strip() and not lines[i].strip().startswith('<<<PAGE_BREAK>>>') and not lines[i].strip().startswith('Certified Tester'):
                            expl.append(lines[i].strip())
                        i += 1
                    if i < len(lines):
                        lo_match = re.match(r'^(FL-\d+\.\d+\.\d+)', lines[i].strip())
                        if lo_match:
                            lo = lo_match.group(1)
                            
                    # Clean up explanation
                    full_expl = clean_text(' '.join(expl))
                    # Compact it
                    if len(full_expl) > 300:
                        full_expl = full_expl[:297] + '...'
                        
                    sols[q_num.upper()] = {
                        'ans': ans,
                        'expl': full_expl,
                        'lo': lo
                    }
        i += 1
    return sols

chapter_names = {
    '1': '1. Fundamentals of Testing',
    '2': '2. Testing Throughout the SDLC',
    '3': '3. Static Testing',
    '4': '4. Test Analysis and Design',
    '5': '5. Managing the Test Activities',
    '6': '6. Test Tools'
}

all_questions_output = []

for exam in exams:
    q_file = os.path.join(base_dir, f'exam_{exam}_questions.txt')
    s_file = os.path.join(base_dir, f'exam_{exam}_solutions.txt')
    
    if not os.path.exists(q_file) or not os.path.exists(s_file):
        continue
        
    qs = parse_questions(q_file)
    ss = parse_solutions(s_file)
    
    all_questions_output.append(f"// --- ESAME {exam} ---")
    
    for q_num, q_data in qs.items():
        if q_num not in ss:
            continue
            
        sol = ss[q_num]
        ans_str = sol['ans']
        correct_letters = [x.strip() for x in ans_str.split(',')]
        
        # map 'a' to 0
        letter_to_idx = {'a':0, 'b':1, 'c':2, 'd':3, 'e':4}
        
        correct_indices = [letter_to_idx[x] for x in correct_letters if x in letter_to_idx]
        if not correct_indices:
            continue
            
        first_correct = correct_indices[0]
        
        expl_text = f"Risposta ufficiale: {ans_str}. {sol['expl']}"
        if len(correct_letters) > 1:
            missing_letters = correct_letters[1:]
            note = f" Attenzione: esame ufficiale chiede ANCHE {', '.join(missing_letters)}."
            expl_text += note
            
        # Format LO
        lo = sol['lo']
        m = re.match(r'FL-(\d+)', lo)
        chapter = "Domanda aggiuntiva"
        if m:
            chapter = chapter_names.get(m.group(1), f"Cap {m.group(1)}")
            
        if q_num.startswith('A') and not q_num == 'A':
             chapter = "Domanda aggiuntiva"
            
        chapter_str = f"{chapter} - {lo}"
        
        opts_formatted = json.dumps([f"{k}) {v}" for k, v in q_data['o']])
        
        q_js = f'{{q: {json.dumps(q_data["q"])}, o: {opts_formatted}, a: {first_correct}, e: {json.dumps(expl_text)}, c: {json.dumps(chapter_str)}}},'
        all_questions_output.append(q_js)

js_content = "const questions = [\n" + "\n".join(all_questions_output) + "\n];\nexport default questions;\n"

out_path = r"C:\Users\USER\OneDrive\Documenti\GitHub\istqb-quiz\questions.js"
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(js_content)
    
print("Done writing to", out_path)
