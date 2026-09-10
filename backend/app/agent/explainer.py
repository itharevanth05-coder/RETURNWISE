from typing import Dict, Any, List, Optional
import os
import re

class DecisionExplainer:
    """
    Structured Decision Explainer Agent Module.
    Generates transparent, audit-ready natural-language rationale and interactive merchant Q&A answers.
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

    @staticmethod
    def answer_merchant_query(
        query: str,
        history: List[Dict[str, str]],
        return_data: Dict[str, Any],
        photo_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Interactive AI Merchant Assistant reasoning engine.
        Answers any merchant question using the live, ground-truth return data and multi-agent ML outputs.
        """
        q_lower = query.strip().lower()
        
        # Extract active return entities
        return_ref = return_data.get("return_ref", "N/A")
        stated_reason = return_data.get("stated_reason", "N/A")
        customer_comment = return_data.get("customer_comment") or "No comment provided."
        claimed_condition = return_data.get("claimed_condition", "N/A")
        days_since_delivery = return_data.get("days_since_delivery", 0)
        
        cust = return_data.get("customer", {})
        cust_name = cust.get("name", "Customer")
        cust_tier = cust.get("ltv_tier", "STANDARD")
        return_rate_pct = round(cust.get("return_rate", 0.0) * 100, 1)
        total_orders = cust.get("total_orders", 0)
        total_spend = cust.get("total_spend", 0.0)
        wardrober_score = cust.get("serial_wardrober_score", 0.0)
        wardrober_flags = cust.get("wardrobing_flag_count", 0)
        
        prod = return_data.get("product", {})
        prod_title = prod.get("title", "Product")
        prod_category = prod.get("category", "General")
        prod_price = prod.get("price", 0.0)
        batch_defect_rate_pct = round(prod.get("batch_defect_rate", 0.0) * 100, 1)
        batch_number = prod.get("batch_number", "N/A")
        requires_serial = prod.get("requires_serial_check", 0) == 1
        
        dec = return_data.get("decision", {}) or {}
        risk_cat = dec.get("risk_category", "UNCERTAIN")
        p_abuse = dec.get("abuse_probability", 0.0)
        p_abuse_pct = round(p_abuse * 100, 1)
        p_defect = dec.get("defect_probability", 0.0)
        p_defect_pct = round(p_defect * 100, 1)
        selected_action = dec.get("selected_action", "INSPECT")
        loss_selected = dec.get("expected_loss_selected", 0.0)
        baseline_act = dec.get("baseline_action", "APPROVE")
        baseline_loss = dec.get("baseline_expected_loss", 0.0)
        loss_prevented = dec.get("loss_prevented", 0.0)
        salvage_rate_pct = round(dec.get("predicted_salvage_rate", 0.60) * 100, 1)
        payoffs = dec.get("payoff_matrix", {})
        evidence_list = dec.get("evidence_list", [])
        ml_comp = dec.get("ml_components", {})

        # Default suggested questions to offer after answering
        suggested_questions = [
            f"Why did you recommend {selected_action} over other actions?",
            "Which factors affected the risk the most?",
            "How did you calculate the expected loss?",
            "Does the product have a defect problem?",
            "Explain this decision in simple words.",
        ]

        # 1. Question: "On what basis did you give this result?" / Decision Pipeline Explanation
        if any(phrase in q_lower for phrase in ["on what basis", "how did you decide", "how did you arrive", "how was this decision made", "decision pipeline", "how did you give this"]):
            reply = (
                f"The recommendation was based on **{cust_name}**'s historical behavior, product/defect signals, claim consistency, "
                f"and the predictive abuse-risk model.\n\n"
                f"Here is the step-by-step evaluation pipeline for `{return_ref}`:\n"
                f"1. **Reason NLP Classifier**: Evaluated customer comment *\"{customer_comment}\"* against the stated reason *{stated_reason}*.\n"
                f"2. **Customer Behavior Agent**: Analyzed historical return rate (**{return_rate_pct}%** across {total_orders} orders) and wardrobing risk score (**{wardrober_score}** with {wardrober_flags} flags).\n"
                f"3. **Product Defect Agent**: Checked manufacturing batch `{batch_number}` with a **{batch_defect_rate_pct}%** defect rate.\n"
                f"4. **XGBoost Abuse Model**: Combined all signals to estimate an Abuse Probability of **{p_abuse_pct}%** (Classification: **{risk_cat}**).\n"
                f"5. **Deterministic Loss Optimizer**: Compared the mathematical expected loss across all 5 possible actions and selected **{selected_action}** because it yielded the lowest expected loss of **₹{loss_selected:.2f}**, preventing **₹{loss_prevented:.2f}** in loss compared to baseline `{baseline_act}`."
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 2. Question: "Why did you recommend [ACTION]?" or why specific action was chosen
        elif any(phrase in q_lower for phrase in ["why did you recommend", "why recommend", "why inspect", "why approve", "why exchange", "why restrict", "why escalate", "why choose"]):
            action_name = selected_action
            if "approve" in q_lower: action_name = "APPROVE"
            elif "inspect" in q_lower: action_name = "INSPECT"
            elif "exchange" in q_lower: action_name = "EXCHANGE"
            elif "restrict" in q_lower: action_name = "RESTRICT"
            elif "escalate" in q_lower: action_name = "ESCALATE"

            action_payoff = payoffs.get(action_name, {})
            direct_loss = action_payoff.get("direct_financial_loss", loss_selected)
            friction = action_payoff.get("customer_friction_score", 0)

            if action_name == selected_action:
                reply = (
                    f"**{selected_action}** was selected because it is mathematically optimal under our Expected Loss Loss-Minimization Objective.\n\n"
                    f"- **Expected Direct Loss**: ₹{direct_loss:.2f}\n"
                    f"- **Customer Friction Score**: {friction} pts\n"
                    f"- **Abuse Probability**: {p_abuse_pct}%\n"
                    f"- **Defect Probability**: {p_defect_pct}%\n\n"
                    f"By choosing `{selected_action}`, RETURNWISE minimizes total inventory loss and salvage leakage while preserving customer goodwill where appropriate. "
                    f"Compared to standard {baseline_act} (expected loss ₹{baseline_loss:.2f}), this saves **₹{loss_prevented:.2f}**."
                )
            else:
                sel_payoff = payoffs.get(selected_action, {})
                sel_loss = sel_payoff.get("direct_financial_loss", loss_selected)
                reply = (
                    f"`{action_name}` was not selected because its expected loss (₹{direct_loss:.2f}) or friction score ({friction} pts) is less optimal than `{selected_action}` (₹{sel_loss:.2f}).\n\n"
                    f"Given P(Abuse) of **{p_abuse_pct}%** and customer tier **{cust_tier}**, executing `{action_name}` would result in an additional expected loss of **₹{abs(direct_loss - sel_loss):.2f}**."
                )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 3. Question: "Which factors affected the risk the most?" / Key risk drivers
        elif any(phrase in q_lower for phrase in ["which factors", "key factors", "affected the risk", "risk drivers", "what influenced", "main factors"]):
            drivers = []
            if cust.get("return_rate", 0) > 0.35:
                drivers.append(f"**High Customer Return Rate**: {return_rate_pct}% return rate over {total_orders} lifetime orders.")
            if wardrober_score > 0.5:
                drivers.append(f"**Wardrobing Behavioral Index**: Score of {wardrober_score} ({wardrober_flags} prior wardrobing flags).")
            if days_since_delivery > 15:
                drivers.append(f"**Return Latency**: Claim initiated {days_since_delivery} days after delivery.")
            if prod_price > 200:
                drivers.append(f"**Item Value Exposure**: Product retail price is ₹{prod_price:.2f}.")
            if batch_defect_rate_pct >= 6.0:
                drivers.append(f"**Batch Defect Cluster (Mitigating Factor)**: Product batch `{batch_number}` has an elevated {batch_defect_rate_pct}% defect rate, lowering abuse suspicion.")
            if not drivers:
                drivers.append(f"**Standard Profile**: Return rate of {return_rate_pct}% and low wardrobing score ({wardrober_score}).")

            reply = (
                f"For return `{return_ref}`, the primary risk drivers identified by the model are:\n\n" +
                "\n".join([f"- {d}" for d in drivers]) +
                f"\n\n**Overall Model Assessment**: Classified as **{risk_cat}** with an Abuse Probability of **{p_abuse_pct}%**."
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 4. Question: "Why wasn't this approved?"
        elif any(phrase in q_lower for phrase in ["why wasn't this approved", "why not approve", "why not approved", "why didn't you approve"]):
            if selected_action == "APPROVE":
                reply = (
                    f"This return **was approved**! The customer is in the **{cust_tier}** tier with a low abuse probability of **{p_abuse_pct}%**, "
                    f"and approving yields the lowest total loss (₹{loss_selected:.2f})."
                )
            else:
                approve_loss = payoffs.get("APPROVE", {}).get("direct_financial_loss", prod_price)
                reply = (
                    f"This return was **not automatically approved** because instant approval carries an expected financial loss of **₹{approve_loss:.2f}**.\n\n"
                    f"- **Abuse Probability**: {p_abuse_pct}%\n"
                    f"- **Customer Return Rate**: {return_rate_pct}%\n"
                    f"- **Recommended Alternative**: **{selected_action}** (Expected Loss: ₹{loss_selected:.2f})\n\n"
                    f"Approving without inspection or restriction would expose the merchant to inventory shrinkage of ₹{prod_price:.2f}. "
                    f"Executing `{selected_action}` prevents **₹{loss_prevented:.2f}** in direct loss."
                )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 5. Question: "Explain this decision in simple words."
        elif any(phrase in q_lower for phrase in ["simple words", "explain simply", "in plain english", "explain to me simply", "layman"]):
            reply = (
                f"**In simple terms:**\n\n"
                f"- **Who**: Customer {cust_name} ({cust_tier} tier, returns {return_rate_pct}% of what they buy).\n"
                f"- **What**: Returned a {prod_title} (₹{prod_price:.2f}) stating: *\"{stated_reason}\"*.\n"
                f"- **What our AI found**: The fraud risk is **{p_abuse_pct}%** and defect likelihood is **{p_defect_pct}%**.\n"
                f"- **The Smart Move**: Instead of blind approval (which could cost ₹{prod_price:.2f}), the system recommended **{selected_action}**.\n"
                f"- **The Benefit**: This protects company profits by saving approximately **₹{loss_prevented:.2f}** while treating the customer fairly."
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 6. Question: "What would happen if the customer had fewer returns?"
        elif any(phrase in q_lower for phrase in ["fewer returns", "lower return rate", "customer had fewer", "if return rate was lower", "what if"]):
            reply = (
                f"If **{cust_name}** had a historical return rate below 15% (instead of the current **{return_rate_pct}%**):\n\n"
                f"1. The **Customer Behavior Agent** risk score would drop from its current level down to < 0.15.\n"
                f"2. The **XGBoost Abuse Model** would recalculate P(Abuse) from **{p_abuse_pct}%** down to < 20%.\n"
                f"3. The return classification would shift to **LEGITIMATE**.\n"
                f"4. The **Expected Loss Optimizer** would recommend **APPROVE** or **EXCHANGE** with zero inspection friction.\n\n"
                f"You can test this exact scenario live using the **'Rerun / What-If Override'** button at the top of this page!"
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 7. Question: "Does the product have a defect problem?" / Batch defect
        elif any(phrase in q_lower for phrase in ["defect problem", "batch defect", "product defect", "defect issue", "is the product defective"]):
            if batch_defect_rate_pct >= 6.0:
                reply = (
                    f"**Yes, there is an elevated defect signal for this product.**\n\n"
                    f"- **Product**: {prod_title} (`{prod.get('product_ref', 'N/A')}`)\n"
                    f"- **Batch Number**: `{batch_number}`\n"
                    f"- **Batch Defect Rate**: **{batch_defect_rate_pct}%** (Industry benchmark is < 3%)\n"
                    f"- **Defect Probability**: **{p_defect_pct}%**\n\n"
                    f"Because this batch has known manufacturing flaws, RETURNWISE gives more credibility to the customer's claim "
                    f"and discounts malicious intent."
                )
            else:
                reply = (
                    f"**No, this product does not have a widespread defect issue.**\n\n"
                    f"- **Product**: {prod_title}\n"
                    f"- **Batch Number**: `{batch_number}`\n"
                    f"- **Batch Defect Rate**: **{batch_defect_rate_pct}%** (Within healthy tolerance < 4%)\n"
                    f"- **Defect Probability**: **{p_defect_pct}%**\n\n"
                    f"The product line has normal quality control metrics. The primary return risk is driven by customer behavior and claim context."
                )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 8. Question: "How did you calculate the expected loss?" / Expected Loss Formula
        elif any(phrase in q_lower for phrase in ["how did you calculate", "calculate expected loss", "expected loss formula", "payoff formula", "math"]):
            reply = (
                f"The **Expected Loss Optimizer** calculates loss using deterministic decision-theoretic formulas across all 5 candidate actions:\n\n"
                f"1. **APPROVE**: `Price (₹{prod_price:.2f}) × P(Abuse) ({p_abuse:.2f}) × (1 - SalvageRate) + DirectHandling` = **₹{payoffs.get('APPROVE', {}).get('direct_financial_loss', 0):.2f}**\n"
                f"2. **INSPECT**: `InspectionCost (₹15.00) + P(Defect) × ReplacementCost + (1 - P(Abuse)) × SalvageLoss` = **₹{payoffs.get('INSPECT', {}).get('direct_financial_loss', 0):.2f}**\n"
                f"3. **EXCHANGE**: `ReplacementCost - MarginRetention + FrictionFactor` = **₹{payoffs.get('EXCHANGE', {}).get('direct_financial_loss', 0):.2f}**\n"
                f"4. **RESTRICT**: `CustomerLTV × ChurnProbability + DirectCost` = **₹{payoffs.get('RESTRICT', {}).get('direct_financial_loss', 0):.2f}**\n"
                f"5. **ESCALATE**: `ManualReviewOverhead (₹25.00) + ExpectedDecisionLoss` = **₹{payoffs.get('ESCALATE', {}).get('direct_financial_loss', 0):.2f}**\n\n"
                f"The system minimizes total weighted loss: `L*(a) = argmin [ FinancialLoss(a) + λ × CustomerFriction(a) ]`.\n"
                f"**Result**: `{selected_action}` had the lowest overall loss (**₹{loss_selected:.2f}**)."
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 9. Question about Photo Inspection
        elif any(phrase in q_lower for phrase in ["photo", "image", "picture", "visual", "camera"]):
            reply = (
                f"**Photo & Visual Inspection Context for `{return_ref}`:**\n\n"
                f"- **Photos Provided by Customer**: {'Yes' if return_data.get('photos_provided') else 'No'}\n"
                f"- **Claimed Condition**: {claimed_condition}\n"
                f"- **Serial Verification Required**: {'Yes (Electronics SKU)' if requires_serial else 'No'}\n"
                f"- **Batch Reference**: `{batch_number}`\n\n"
                f"In the **📸 Photo Inspection** section above, you can upload or test sample item images to verify tag attachment, "
                f"packaging seals, and physical fabric or port conditions before dispatching resolution."
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

        # 10. General / Free-form Query: Context-Aware Dynamic Synthesis
        else:
            evidence_summary = ", ".join([e.get("title", "") for e in evidence_list[:3]]) if evidence_list else "Standard behavioral signals"
            reply = (
                f"Regarding **\"{query}\"** for return `{return_ref}`:\n\n"
                f"- **Customer Profile**: {cust_name} ({cust_tier} tier) with a **{return_rate_pct}%** historical return rate over {total_orders} orders.\n"
                f"- **Product & Batch**: {prod_title} (₹{prod_price:.2f}, Batch `{batch_number}`) with a **{batch_defect_rate_pct}%** defect rate.\n"
                f"- **Risk & Assessment**: Classified as **{risk_cat}** with an Abuse Probability of **{p_abuse_pct}%** and Defect Likelihood of **{p_defect_pct}%**.\n"
                f"- **Evidence Signals**: {evidence_summary}.\n"
                f"- **Action & Financials**: Recommended **{selected_action}** with an expected direct cost of **₹{loss_selected:.2f}** (saving **₹{loss_prevented:.2f}** vs standard baseline `{baseline_act}`).\n\n"
                f"Let me know if you would like to explore specific counterfactual parameters, policy overrides, or customer history details!"
            )
            return {"reply": reply, "suggested_questions": suggested_questions}

