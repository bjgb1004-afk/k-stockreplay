import re

with open('src/components/MorningNews2026.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Sun/Moon icons to import
content = content.replace("CheckCircle2 } from 'lucide-react'", "CheckCircle2, Sun, Moon } from 'lucide-react'")

# Add state
content = content.replace("export const MorningNews2026 = () => {", """export const MorningNews2026 = () => {
  const [isDark, setIsDark] = useState(true);
""")

# Add toggle button next to AUTO PIPELINE ACTIVE (which was removed)
header_pattern = r'<span className="px-3 py-1\.5 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/30 shrink-0">\s*AUTO PIPELINE ACTIVE\s*</span>'
toggle_button = """<button 
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-amber-400 hover:bg-slate-900' : 'bg-white border-slate-200 text-indigo-500 hover:bg-slate-50'}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>"""

content = re.sub(header_pattern, toggle_button, content)

# Replace static classes with dynamic template literals
replacements = {
    'bg-slate-900': "${isDark ? 'bg-slate-900' : 'bg-white'}",
    'bg-slate-950': "${isDark ? 'bg-slate-950' : 'bg-slate-50'}",
    'bg-slate-950/50': "${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}",
    'border-slate-800': "${isDark ? 'border-slate-800' : 'border-slate-200'}",
    'border-slate-850': "${isDark ? 'border-slate-850' : 'border-slate-200'}",
    'text-slate-200': "${isDark ? 'text-slate-200' : 'text-slate-900'}",
    'text-slate-300': "${isDark ? 'text-slate-300' : 'text-slate-700'}",
    'text-slate-400': "${isDark ? 'text-slate-400' : 'text-slate-600'}",
    'text-slate-500': "${isDark ? 'text-slate-500' : 'text-slate-500'}",
    'text-indigo-400': "${isDark ? 'text-indigo-400' : 'text-indigo-600'}",
    'text-indigo-300/80': "${isDark ? 'text-indigo-300/80' : 'text-indigo-600'}",
    'from-slate-900': "${isDark ? 'from-slate-900' : 'from-slate-50'}",
    'to-indigo-950/30': "${isDark ? 'to-indigo-950/30' : 'to-indigo-50'}",
    'bg-rose-950/20': "${isDark ? 'bg-rose-950/20' : 'bg-rose-50'}",
    'border-rose-900/50': "${isDark ? 'border-rose-900/50' : 'border-rose-200'}",
    'text-rose-200/90': "${isDark ? 'text-rose-200/90' : 'text-rose-700'}",
    'bg-slate-800': "${isDark ? 'bg-slate-800' : 'bg-slate-200'}",
    'text-white': "${isDark ? 'text-white' : 'text-slate-900'}",
}

def replace_classes(match):
    original_classes = match.group(1)
    new_classes = original_classes
    needs_template = False
    
    for old, new in replacements.items():
        if old in new_classes:
            new_classes = new_classes.replace(old, new)
            needs_template = True
            
    if needs_template:
        return f'className={{`{new_classes}`}}'
    return match.group(0)

# Also fix the text sizes to be uniform.
# Description texts for 4. 미국 특징주:
content = content.replace('text-[10px] text-slate-400', 'text-xs text-slate-400')
# Description texts for 2. 미 증시:
content = content.replace('text-[9px] text-slate-500', 'text-xs text-slate-500')
content = content.replace('text-[11px] text-slate-400', 'text-xs text-slate-400')
# And 1. 거시지표 description
# Already replaced above in line 84: <span className="text-[9px] text-slate-500 mt-1 block leading-tight">
content = content.replace('text-[9px] text-slate-500 mt-1 block leading-tight', 'text-xs text-slate-500 mt-1 block leading-tight')


content = re.sub(r'className="([^"]+)"', replace_classes, content)

with open('src/components/MorningNews2026.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

