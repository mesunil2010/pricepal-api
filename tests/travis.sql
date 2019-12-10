# Create Testuser
CREATE USER 'dev'@'localhost' IDENTIFIED BY 'dev';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP ON *.* TO 'dev'@'localhost';

# Create Legacy DB
CREATE DATABASE IF NOT EXISTS `starthere_test` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;