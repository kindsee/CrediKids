# 🚀 Checklist Rápida - Actualizar Producción

## ✅ Pasos a seguir cada vez que subes cambios

### 1️⃣ Backend (en el servidor)
```bash
cd /var/www/credikids/backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt

# IMPORTANTE: Verificar que no hay errores de sintaxis
python -m py_compile app.py
python -c "from routes import tasks, calendar, users; print('✓ Imports OK')"

# Reiniciar servicio
sudo systemctl restart credikids-backend
sleep 2
sudo systemctl status credikids-backend

# Verificar endpoints
chmod +x /var/www/credikids/check_backend.sh
/var/www/credikids/check_backend.sh
```

### 2️⃣ Frontend (desde tu PC)
```bash
# En tu PC local
cd frontend
npm run build

# Subir al servidor
rsync -avz --delete dist/ usuario@servidor:/var/www/credikids/frontend/dist/

# En el servidor
sudo chown -R www-data:www-data /var/www/credikids/frontend/dist
sudo chmod -R 755 /var/www/credikids/frontend/dist
```

### 3️⃣ Apache (en el servidor)
```bash
sudo systemctl reload apache2
# o si no funciona:
sudo systemctl restart apache2
```

### 4️⃣ Verificar
- [ ] Backend responde: `curl http://localhost:5001/api/icons`
- [ ] Apache está corriendo: `sudo systemctl status apache2`
- [ ] Servicio backend OK: `sudo systemctl status credikids-backend`
- [ ] Abrir navegador y presionar `Ctrl + Shift + R` (forzar recarga)
- [ ] Revisar consola del navegador (F12) - no debe haber errores 404

### 🔍 Si algo falla:

**Ver logs del backend:**
```bash
sudo journalctl -u credikids-backend -n 100 --no-pager
```

**Ver logs de Apache:**
```bash
sudo tail -50 /var/log/apache2/credikids-error.log
```

**Verificar proxy de Apache:**
```bash
sudo apache2ctl -M | grep proxy
# Debe mostrar: proxy_module, proxy_http_module
```

**Limpiar caché del navegador:**
- Chrome/Edge: `Ctrl + Shift + Delete`
- Selecciona "Imágenes y archivos en caché"
- Selecciona "Todo el tiempo"
- Click en "Borrar datos"

---

## 🆘 Problema: "Error 404 en /api/..."

**Causa:** El proxy de Apache no está redirigiendo correctamente

**Solución:**
```bash
# Editar configuración
sudo nano /etc/apache2/sites-available/credikids.conf

# Verificar estas líneas existen:
ProxyPass /api http://localhost:5001/api
ProxyPassReverse /api http://localhost:5001/api

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Habilitar módulos proxy
sudo a2enmod proxy proxy_http

# Reiniciar Apache
sudo systemctl restart apache2
```

---

## 🆘 Problema: "Backend no responde"

**Solución:**
```bash
# Ver error
sudo journalctl -u credikids-backend -n 20

# Reiniciar servicio
sudo systemctl restart credikids-backend

# Si no arranca, iniciar manualmente para ver error
cd /var/www/credikids/backend
source venv/bin/activate
python app.py
```

---

## 🆘 Problema: "Página en blanco"

**Solución:**
```bash
# Verificar archivos
ls -la /var/www/credikids/frontend/dist/index.html

# Corregir permisos
sudo chown -R www-data:www-data /var/www/credikids/frontend/dist
sudo chmod -R 755 /var/www/credikids/frontend/dist

# Limpiar caché del navegador (Ctrl + Shift + Delete)
```

---

## 📝 Notas importantes

- **Siempre** compila el frontend en tu PC local antes de subir
- **Siempre** reinicia el backend después de hacer pull del código
- **Siempre** limpia caché del navegador después de actualizar frontend
- **Nunca** olvides ajustar permisos después de subir archivos

---

## ⚠️ Error Común: Sintaxis SQLAlchemy

**Problema:** Endpoints devuelven 404 o 500 después de actualizar

**Causa:** Comparaciones SQLAlchemy incorrectas en filtros

**Solución:**
```bash
cd /var/www/credikids/backend

# INCORRECTO ❌:
# TaskAssignment.is_completed == True
# TaskCompletion.validation_score == None

# CORRECTO ✅:
# TaskAssignment.is_completed.is_(True)
# TaskCompletion.validation_score.is_(None)

# Buscar y corregir:
grep -rn "== True" routes/
grep -rn "== False" routes/
grep -rn "== None" routes/
```

---

**Tip:** Guarda este checklist en tu escritorio para consultarlo rápidamente 🎯
