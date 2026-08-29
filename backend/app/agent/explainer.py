from typing import Dict, Any, List

class DecisionExplainer:
    """
    Structured Decision Explainer Agent Module.
    Generates transparent, audit-ready natural-language rationale and evidence breakdowns.
    """

    @staticmethod
    def generate_explanation(
        risk_category: str,
        abuse_probability: float,
        defect_probability: float,
        selected_action: str,
        payoff_matrix: Dict[str, Any],
        baseline_info: Dict[str, Any],
        loss_prevented: float,
        evidence_list: List[Dict[str, str]],
        customer_name: str,
        product_title: str,
        price: float
    ) -> Dict[str, str]:
        p_abuse_pct = round(abuse_probability * 100, 1)
        p_defect_pct = round(defect_probability * 100, 1)
        
        # 1. Executive Summary
        if risk_category == "LEGITIMATE":
            summary = (
                f"Classified as LEGITIMATE (Abuse Risk: {p_abuse_pct}%). "
                f"Recommended action is {selected_action} with expected direct cost of ₹{payoff_matrix[selected_action]['direct_financial_loss']}. "
                f"Customer profile indicates low historical abuse velocity with plausible return context."
            )
        elif risk_category == "POTENTIAL_ABUSE":
            summary = (
                f"Classified as POTENTIAL ABUSE (Abuse Risk: {p_abuse_pct}%). "
                f"Recommended action is {selected_action} to mitigate fraud risk and save company margin. "
                f"Estimated expected loss reduction of ₹{round(loss_prevented, 2)} compared to standard baseline approval."
            )
        else:
            summary = (
                f"Classified as UNCERTAIN (Abuse Risk: {p_abuse_pct}%, Defect Probability: {p_defect_pct}%). "
                f"Recommended action is {selected_action} to resolve ambiguity without unnecessary customer friction or inventory loss."
            )

        # 2. Detailed Multi-Point Justification
        high_severity_evidence = [e['description'] for e in evidence_list if e.get('severity') == 'HIGH']
        evidence_bullet_str = "\n".join([f"- **{e['title']}**: {e['description']}" for e in evidence_list])
        
        actions_str = "\n".join([
            f"- **{act}**: Direct Expected Loss = ₹{data['direct_financial_loss']} | Friction Score = {data['customer_friction_score']} | Weighted Total = ₹{data['weighted_total_loss']}"
            for act, data in payoff_matrix.items()
        ])

        detailed_text = f"""### Autonomous Investigation Audit Report
**Customer:** {customer_name} | **Product:** {product_title} (₹{price})
**Assessment:** {risk_category} | **P(Abuse):** {p_abuse_pct}% | **P(Defect):** {p_defect_pct}%

#### 1. Key Evidence Signals
{evidence_bullet_str}

#### 2. Action Payoff Comparison
{actions_str}

#### 3. Decision Rationale & Baseline Benchmark
- **Standard Baseline Policy Outcome:** {baseline_info['baseline_action']} (Expected Loss: ₹{baseline_info['baseline_direct_loss']})
- **RETURNWISE Optimized Action:** {selected_action} (Expected Loss: ₹{payoff_matrix[selected_action]['direct_financial_loss']})
- **Net Prevented Loss:** ₹{round(loss_prevented, 2)}

**Strategic Rationale:**
The model selected `{selected_action}` because it minimizes the weighted total loss function combining direct inventory cost, restocking recovery, and customer churn risk. {'Critical high-severity risk signals were detected requiring preventative action.' if high_severity_evidence else 'Signals align with acceptable merchant tolerance.'}
"""

        return {
            "summary": summary,
            "detailed": detailed_text
        }
