# RETURNWISE ML Data Requirements & Target Audit Document

---

## 1. Overview & Data Sources

RETURNWISE leverages multi-dimensional retail and e-commerce signals across customers, orders, products, and return transactions.

### Data Storage & Formats:
1. **SQLite Database (ackend/returnwise.db)**:
   - customers (13 entities)
   - products (16 catalog items)
   - orders (12 order records)
   - eturn_requests (13 return requests)
   - decisions (13 AI decision audit records)
   - udit_logs (13 immutable audit entries)
2. **Tabular Training Dataset (ackend/data/synthetic_returns.csv)**:
   - 2,000 synthetic return instances with ground-truth labels for abuse risk and salvage recovery rate.

---

## 2. Exact Fields Currently Available

| Field Name | Source | Data Type | Description |
|---|---|---|---|
| customer_ref | SQLite / Customer | String | Unique customer identifier |
| 	otal_orders | SQLite / Customer | Integer | Lifetime completed order count |
| 	otal_spend | SQLite / Customer | Float | Lifetime gross revenue ($) |
| 	otal_returns | SQLite / Customer | Integer | Lifetime count of returned items |
| eturn_rate | SQLite & CSV | Float (0.0–1.0) | Historical return frequency ({\text{returns}} / N_{\text{orders}}$) |
| wardrobing_flag_count / wardrobe_flags | SQLite & CSV | Integer | Number of prior wear / event-cycle flags |
| serial_wardrober_score / wardrobe_score | SQLite & CSV | Float (0.0–1.0) | Heuristic score for tag manipulation / Friday-buy-Monday-return velocity |
| ltv_tier | SQLite / Customer | Categorical | Customer tier: VIP, HIGH_VALUE, STANDARD, AT_RISK |
| product_ref | SQLite / Product | String | Unique product SKU |
| 	itle | SQLite / Product | String | Full product display name |
| category | SQLite & CSV | Categorical | Electronics, Luxury Apparel, Designer Handbags, Footwear, Apparel, Home & Kitchen |
| price | SQLite & CSV | Float | Retail selling price ($) |
| cost_price | SQLite & CSV | Float | Merchant cost of goods sold ($) |
| atch_defect_rate | SQLite & CSV | Float (0.0–1.0) | Manufacturing defect frequency for this item's production batch |
| historical_return_rate | SQLite / Product | Float (0.0–1.0) | Global return rate for this SKU across all customers |
| is_high_shrink | SQLite / Product | Boolean / Binary | Flag for high resale theft / swap vulnerability |
| equires_serial_check | SQLite / Product | Boolean / Binary | Serialized electronics requiring hardware intake check |
| days_since_delivery | SQLite & CSV | Integer | Elapsed days between delivery and return initiation |
| photos_provided | SQLite & CSV | Boolean / Binary | Whether customer uploaded visual proof |
| stated_reason | SQLite & CSV | Categorical | DEFECTIVE, DOES_NOT_FIT, CHANGED_MIND, NOT_AS_DESCRIBED, WRONG_ITEM |
| claimed_condition | SQLite & CSV | Categorical | UNOPENED, OPENED_LIKE_NEW, USED, DAMAGED |
| customer_comment | SQLite & CSV | Text | Customer freeform explanation |

---

## 3. Mapping Fields to the 6 Required AI/ML Components

### Component 1: Return-Reason Classification & Discrepancy Detection
- **Input Features**: customer_comment (text), stated_reason (categorical), category (categorical), claimed_condition (categorical), days_since_delivery (numeric), photos_provided (binary).
- **Engineered Features**: wardrobe_keyword_hits, defect_keyword_hits, comment_char_length, comment_word_count, semantic_discrepancy_flag.
- **Target Label**: is_discrepancy / 	rue_reason_category.

### Component 2: Customer Behavior Modeling
- **Input Features**: eturn_rate, wardrober_score, wardrobing_flags, 	otal_orders, 	otal_spend, 	otal_returns, ccount_age_days.
- **Engineered Features**: eturn_rate_velocity_adjusted, customer_risk_score.
- **Target Label**: customer_risk_tier (TRUSTED_BUYER, STANDARD_MONITORED, HIGH_ABUSE_VELOCITY).

### Component 3: Product-Defect Pattern Detection
- **Input Features**: atch_defect_rate, historical_return_rate, category, price, atch_number, endor_id, defect_keyword_hits, customer_comment.
- **Engineered Features**: atch_anomaly_flag ($>6\%$), defect_signal_strength.
- **Target Label**: is_known_defective_batch / erified_defect_flag.

### Component 4: Return-Abuse Risk Prediction
- **Input Features**: Full multi-entity vector combining customer velocity, product shrink risk, timing, condition, comment sentiment/keywords, price, and photos.
- **Engineered Features**: price_to_cost_ratio, is_high_ticket, is_luxury_ticket, is_rapid_return, is_late_return, semantic_discrepancy_flag.
- **Target Label**: is_abuse (binary 0 or 1).

### Component 5: Resale-Value Prediction
- **Input Features**: price, cost_price, claimed_condition, days_since_delivery, category, is_high_shrink.
- **Engineered Features**: condition_depreciation_factor, ge_depreciation_penalty, shrink_markdown_penalty.
- **Target Label**: salvage_rate (continuous float $\in [0.10, 0.85]$).

### Component 6: Expected-Loss Estimation & Decision Optimizer
- **Input Features**: (\text{Abuse})$, (\text{Defect})$, $\hat{S}$ (Salvage Rate), price, cost_price, customer_ltv, inspection_cost, escalation_cost, riction_weight.
- **Target Label**: **N/A (Pure Deterministic Financial Objective Function)**.

---

## 4. Target / Label Audit

### ✅ Available Targets:
1. is_abuse (Binary 0 / 1): Available in synthetic_returns.csv across 2,000 samples.
2. salvage_rate (Continuous Float 0.10–0.85): Available in synthetic_returns.csv across 2,000 samples.

### ⚠️ Missing Targets (Requiring Production Data Collection / Annotations):
1. **Verified True Return Reason (erified_reason_category)**:
   - Currently, stated_reason is recorded at intake. Physical warehouse verification logs confirming if the claim was genuine or a pretext are not yet recorded as a distinct post-inspection field.
2. **Verified Physical Defect Confirmation (physical_defect_confirmed)**:
   - Warehouse QA test results confirming whether a returned unit had a genuine manufacturing flaw vs. user-induced damage.
3. **Realized Secondary Liquidation Price (ctual_salvage_recovered_usd)**:
   - Realized downstream auction/b2b resale price to validate the resale-value regressor against real liquidation yields.
4. **Post-Resolution Customer Churn & Dispute Outcomes (customer_churned_30d, chargeback_filed)**:
   - Longitudinal tracking of whether a customer contested a RESTRICT decision or churned after experiencing inspection friction.

---

## 5. Preprocessing & Leakage Prevention Protocol

1. **Partitioning**: Stratified 70% Train / 15% Validation / 15% Test split performed **before** any feature transformation.
2. **Zero Leakage Rule**: All imputers (medians), categorical encoders (One-Hot), scalers (StandardScaler), and text vectorizers (TF-IDF) are **fit strictly on 	rain_df**.
3. **Unseen Categories**: Handled gracefully via handle_unknown='ignore' in OneHotEncoder and median fallback for numerical inputs.
4. **Target Isolation**: Target columns (is_abuse, salvage_rate) and identification keys (eturn_id, customer_id, product_id) are strictly segregated from feature matrices.
