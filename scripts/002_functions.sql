-- RoundUp Database Schema - Part 2: Functions & Data

-- Function: Calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INT)
RETURNS INT AS $$
BEGIN
  IF xp < 100 THEN RETURN 1;
  ELSIF xp < 300 THEN RETURN 2;
  ELSIF xp < 600 THEN RETURN 3;
  ELSIF xp < 1000 THEN RETURN 4;
  ELSIF xp < 1500 THEN RETURN 5;
  ELSE RETURN 6;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Detect spending personality from transactions
CREATE OR REPLACE FUNCTION detect_spending_personality(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  food_pct DECIMAL;
  transport_pct DECIMAL;
  shopping_pct DECIMAL;
  entertainment_pct DECIMAL;
  total_spent DECIMAL;
BEGIN
  SELECT SUM(amount) INTO total_spent FROM transactions 
  WHERE transactions.user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days';
  
  IF total_spent = 0 OR total_spent IS NULL THEN RETURN 'turtle'; END IF;
  
  SELECT (SUM(CASE WHEN category = 'food' THEN amount ELSE 0 END) / total_spent * 100)::INT INTO food_pct FROM transactions WHERE transactions.user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days';
  SELECT (SUM(CASE WHEN category = 'transport' THEN amount ELSE 0 END) / total_spent * 100)::INT INTO transport_pct FROM transactions WHERE transactions.user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days';
  SELECT (SUM(CASE WHEN category = 'shopping' THEN amount ELSE 0 END) / total_spent * 100)::INT INTO shopping_pct FROM transactions WHERE transactions.user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days';
  SELECT (SUM(CASE WHEN category = 'entertainment' THEN amount ELSE 0 END) / total_spent * 100)::INT INTO entertainment_pct FROM transactions WHERE transactions.user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days';
  
  IF food_pct > 40 THEN RETURN 'bee';
  ELSIF shopping_pct > 35 THEN RETURN 'butterfly';
  ELSIF entertainment_pct > 30 THEN RETURN 'lion';
  ELSIF transport_pct > 30 THEN RETURN 'eagle';
  ELSIF total_spent < 5000 THEN RETURN 'fox';
  ELSE RETURN 'turtle';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate spending roast
CREATE OR REPLACE FUNCTION generate_spending_roast(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  personality TEXT;
  top_category TEXT;
  total_spent DECIMAL;
  roast_text TEXT;
BEGIN
  SELECT detect_spending_personality($1) INTO personality;
  SELECT category, SUM(amount) INTO top_category, total_spent FROM transactions 
  WHERE transactions.user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days'
  GROUP BY category ORDER BY SUM(amount) DESC LIMIT 1;
  
  CASE personality
    WHEN 'bee' THEN roast_text := 'Busy Bee Alert! You''ve spent more on food than a restaurant owner. Your local swiggy waiter misses you already!';
    WHEN 'butterfly' THEN roast_text := 'Fashion Forward Butterfly! Your shopping cart is bigger than your savings. Time to admire clothes at home instead!';
    WHEN 'lion' THEN roast_text := 'Party Lion! You''re the life of every gathering. Your piggy bank is crying!';
    WHEN 'eagle' THEN roast_text := 'Frequent Flyer Eagle! You''ve seen more places than your savings has grown!';
    WHEN 'fox' THEN roast_text := 'Smart Fox! You''re making smart moves. Your savings are growing, we like that!';
    ELSE roast_text := 'Turtle Mode! Taking it slow and steady. Your savings curve is starting to look sweet!';
  END CASE;
  
  RETURN roast_text;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate round-up amount
CREATE OR REPLACE FUNCTION calculate_roundup(amount DECIMAL, aggressiveness TEXT)
RETURNS DECIMAL AS $$
BEGIN
  CASE aggressiveness
    WHEN 'conservative' THEN RETURN CEIL(amount / 10) * 10 - amount;
    WHEN 'moderate' THEN RETURN CEIL(amount / 100) * 100 - amount;
    WHEN 'aggressive' THEN RETURN CEIL(amount / 100) * 100 - amount + 50;
    ELSE RETURN CEIL(amount / 100) * 100 - amount;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert default investment options
INSERT INTO investment_options (name, description, risk_level, expected_annual_return, icon_type)
VALUES
  ('Digital Gold', 'Fractional gold investment via Digit, SafeGold', 'low', 4.50, 'digital-gold'),
  ('Index Funds', 'Nifty 50 & Sensex tracking funds (ICICI, HDFC)', 'medium', 12.00, 'index-fund'),
  ('Fixed Deposits', 'Bank FDs with 6-7% annual returns', 'low', 6.50, 'fixed-deposit'),
  ('SIP', 'Systematic Investment Plan in mutual funds', 'medium', 11.00, 'sip'),
  ('Government Securities', 'NSC, Sukanya Samriddhi Scheme', 'low', 5.50, 'govt-security')
ON CONFLICT DO NOTHING;
