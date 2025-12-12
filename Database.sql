# Conectar a MariaDB (usa la contraseña que configuraste)
#mysql -u root -p

# Dentro de MySQL, ejecuta:
CREATE DATABASE credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'credikids_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Conectar a MariaDB. Problema de permisos con IPS. Si no funciona para ti
#mysql -u root -p

# Dentro de MySQL, dar permisos al usuario desde tu IP
CREATE USER IF NOT EXISTS 'credikids_user'@'192.168.68.61' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'192.168.68.61';
FLUSH PRIVILEGES;

# O si prefieres permitir desde cualquier IP (menos seguro):
CREATE USER IF NOT EXISTS 'credikids_user'@'%' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'%';
FLUSH PRIVILEGES;

# Verificar permisos
SELECT user, host FROM mysql.user WHERE user='credikids_user';

EXIT;

