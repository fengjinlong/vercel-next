CREATE TABLE IF NOT EXISTS option_estimates (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  current_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  lower_bound DECIMAL(20, 2) NOT NULL,
  upper_bound DECIMAL(20, 2) NOT NULL,
  lower_bound_95 DECIMAL(20, 2) NOT NULL,
  upper_bound_95 DECIMAL(20, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 