import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.db.models import ReturnRequest, Customer, Product, Decision, AuditLog
from app.ml.feature_store import FeatureStore
from app.ml.pipelines.reason_classifier import ReturnReasonClassifier
from app.ml.pipelines.customer_behavior import CustomerBehaviorModel
from app.ml.pipelines.product_defect import ProductDefectModel
from app.ml.pipelines.resale_value import ResaleValueModel
from app.ml.pipelines.abuse_risk import ReturnAbuseRiskModel
from app.engine.expected_loss import FinancialLossCalculator
from app.engine.rule_baseline import RuleBaselineEngine
from app.engine.action_optimizer import ActionOptimizer
from app.agent.evidence_collector import EvidenceCollector
from app.agent.explainer import DecisionExplainer
from app.config import settings

class AutonomousReturnInvestigator:
    """
    Main Autonomous Agent orchestrating return triage, multi-model evaluation,
    deterministic decision-making, and audit logging.
    """

    def __init__(self):
        self.reason_classifier = ReturnReasonClassifier()
        self.customer_model = CustomerBehaviorModel()
        self.defect_model = ProductDefectModel()
        self.resale_model = ResaleValueModel()
        self.abuse_model = ReturnAbuseRiskModel()

    def investigate(
        self,
        db: Session,
        return_id: int,
        overrides: Optional[Dict[str, Any]] = None,
        actor: str = "AUTONOMOUS_AGENT"
    ) -> Dict[str, Any]:
        """
        Executes or re-runs an autonomous investigation on a return request.
        """
        overrides = overrides or {}

        # 1. Fetch Entities
        return_req = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
        if not return_req:
            raise ValueError(f"Return request with ID {return_id} not found.")

        customer = db.query(Customer).filter(Customer.id == return_req.customer_id).first()
        product = db.query(Product).filter(Product.id == return_req.product_id).first()

        # Build raw dicts for feature extraction with any override applied
        customer_dict = {
            "total_orders": customer.total_orders,
            "total_returns": customer.total_returns,
            "return_rate": overrides.get("override_customer_return_rate", customer.return_rate),
            "serial_wardrober_score": customer.serial_wardrober_score,
            "wardrobing_flag_count": customer.wardrobing_flag_count,
            "ltv_tier": customer.ltv_tier
        }

        product_dict = {
            "price": product.price,
            "cost_price": product.cost_price,
            "batch_defect_rate": overrides.get("override_batch_defect_rate", product.batch_defect_rate),
            "historical_return_rate": product.historical_return_rate,
            "is_high_shrink": product.is_high_shrink,
            "requires_serial_check": product.requires_serial_check,
            "batch_number": product.batch_number,
            "vendor_id": product.vendor_id
        }

        return_dict = {
            "days_since_delivery": return_req.days_since_delivery,
            "stated_reason": overrides.get("override_stated_reason", return_req.stated_reason),
            "customer_comment": return_req.customer_comment,
            "claimed_condition": return_req.claimed_condition,
            "photos_provided": return_req.photos_provided
        }

        # 2. Extract Features
        features = FeatureStore.extract_features(customer_dict, product_dict, return_dict)

        # 3. Execute 5 ML Pipeline Inferences
        reason_res = self.reason_classifier.predict(features)
        customer_res = self.customer_model.predict(features)
        defect_res = self.defect_model.predict(features)
        resale_res = self.resale_model.predict(features)
        abuse_res = self.abuse_model.predict(features, reason_res, customer_res, defect_res)

        ml_results = {
            "reason_classification": reason_res,
            "customer_behavior": customer_res,
            "product_defect": defect_res,
            "resale_value": resale_res,
            "abuse_risk": abuse_res
        }

        # 4. Deterministic Financial Calculations
        p_abuse = abuse_res["abuse_probability"]
        p_defect = defect_res["defect_probability"]
        salvage_rate = resale_res["predicted_salvage_rate"]
        inspection_cost = overrides.get("override_inspection_cost", settings.INSPECTION_COST_DEFAULT)

        payoff_matrix = FinancialLossCalculator.calculate_action_losses(
            price=product.price,
            cost_price=product.cost_price,
            p_abuse=p_abuse,
            p_defect=p_defect,
            salvage_rate=salvage_rate,
            customer_ltv=customer.total_spend or 250.0,
            inspection_cost=inspection_cost
        )

        baseline_res = RuleBaselineEngine.evaluate_baseline(
            days_since_delivery=return_req.days_since_delivery,
            price=product.price,
            action_payoffs=payoff_matrix
        )

        # 5. Deterministic Optimization & Action Selection
        optimization_res = ActionOptimizer.optimize_decision(
            risk_category=abuse_res["risk_category"],
            p_abuse=p_abuse,
            p_defect=p_defect,
            stated_reason=return_dict["stated_reason"],
            price=product.price,
            action_payoffs=payoff_matrix,
            requires_serial_check=product.requires_serial_check
        )

        selected_action = optimization_res["optimal_action"]
        chosen_loss = optimization_res["chosen_direct_loss"]
        loss_prevented = max(0.0, baseline_res["baseline_direct_loss"] - chosen_loss)

        # 6. Structured Evidence Collection
        evidence_list = EvidenceCollector.collect_evidence(
            customer_data=customer_dict,
            product_data=product_dict,
            return_data=return_dict,
            ml_results=ml_results
        )

        # 7. Explain Decision
        explanation = DecisionExplainer.generate_explanation(
            risk_category=abuse_res["risk_category"],
            abuse_probability=p_abuse,
            defect_probability=p_defect,
            selected_action=selected_action,
            payoff_matrix=payoff_matrix,
            baseline_info=baseline_res,
            loss_prevented=loss_prevented,
            evidence_list=evidence_list,
            customer_name=customer.name,
            product_title=product.title,
            price=product.price
        )

        # 8. Persist Decision & Audit Log
        expected_loss_summary = {
            "optimal_action": selected_action,
            "expected_loss_selected": chosen_loss,
            "baseline_action": baseline_res["baseline_action"],
            "baseline_expected_loss": baseline_res["baseline_direct_loss"],
            "loss_prevented": loss_prevented,
            "payoff_matrix": payoff_matrix
        }

        ml_components = {
            "reason_classification": reason_res,
            "customer_behavior": customer_res,
            "product_defect": defect_res,
            "abuse_risk": abuse_res,
            "resale_value": resale_res,
            "expected_loss": expected_loss_summary
        }

        is_rerun = False
        existing_decision = db.query(Decision).filter(Decision.return_id == return_id).first()
        
        if existing_decision:
            is_rerun = True
            prev_state = {
                "selected_action": existing_decision.selected_action,
                "risk_category": existing_decision.risk_category,
                "expected_loss_selected": existing_decision.expected_loss_selected
            }
            # Update existing
            existing_decision.risk_category = abuse_res["risk_category"]
            existing_decision.abuse_probability = p_abuse
            existing_decision.defect_probability = p_defect
            existing_decision.predicted_salvage_rate = salvage_rate
            existing_decision.selected_action = selected_action
            existing_decision.expected_loss_selected = chosen_loss
            existing_decision.expected_loss_approve = payoff_matrix["APPROVE"]["direct_financial_loss"]
            existing_decision.expected_loss_inspect = payoff_matrix["INSPECT"]["direct_financial_loss"]
            existing_decision.expected_loss_exchange = payoff_matrix["EXCHANGE"]["direct_financial_loss"]
            existing_decision.expected_loss_restrict = payoff_matrix["RESTRICT"]["direct_financial_loss"]
            existing_decision.expected_loss_escalate = payoff_matrix["ESCALATE"]["direct_financial_loss"]
            existing_decision.baseline_action = baseline_res["baseline_action"]
            existing_decision.baseline_expected_loss = baseline_res["baseline_direct_loss"]
            existing_decision.loss_prevented = loss_prevented
            existing_decision.reasoning_summary = explanation["summary"]
            existing_decision.detailed_explanation = explanation["detailed"]
            existing_decision.evidence_payload = json.dumps(evidence_list)
            existing_decision.payoff_matrix_payload = json.dumps(payoff_matrix)
            existing_decision.ml_components_payload = json.dumps(ml_components)
            existing_decision.updated_at = datetime.datetime.utcnow()

            new_state = {
                "selected_action": selected_action,
                "risk_category": abuse_res["risk_category"],
                "expected_loss_selected": chosen_loss
            }

            audit = AuditLog(
                return_id=return_id,
                action_type="DECISION_RERUN",
                actor=actor,
                previous_state=json.dumps(prev_state),
                new_state=json.dumps(new_state),
                note=overrides.get("merchant_notes", "Decision re-evaluated following context or policy updates.")
            )
            db.add(audit)
        else:
            new_decision = Decision(
                return_id=return_id,
                risk_category=abuse_res["risk_category"],
                abuse_probability=p_abuse,
                defect_probability=p_defect,
                predicted_salvage_rate=salvage_rate,
                selected_action=selected_action,
                expected_loss_selected=chosen_loss,
                expected_loss_approve=payoff_matrix["APPROVE"]["direct_financial_loss"],
                expected_loss_inspect=payoff_matrix["INSPECT"]["direct_financial_loss"],
                expected_loss_exchange=payoff_matrix["EXCHANGE"]["direct_financial_loss"],
                expected_loss_restrict=payoff_matrix["RESTRICT"]["direct_financial_loss"],
                expected_loss_escalate=payoff_matrix["ESCALATE"]["direct_financial_loss"],
                baseline_action=baseline_res["baseline_action"],
                baseline_expected_loss=baseline_res["baseline_direct_loss"],
                loss_prevented=loss_prevented,
                reasoning_summary=explanation["summary"],
                detailed_explanation=explanation["detailed"],
                evidence_payload=json.dumps(evidence_list),
                payoff_matrix_payload=json.dumps(payoff_matrix),
                ml_components_payload=json.dumps(ml_components)
            )
            db.add(new_decision)
            
            audit = AuditLog(
                return_id=return_id,
                action_type="INITIAL_INVESTIGATION",
                actor=actor,
                new_state=json.dumps({"selected_action": selected_action, "risk_category": abuse_res["risk_category"]}),
                note="Initial autonomous return investigation completed."
            )
            db.add(audit)

        return_req.status = "INVESTIGATED"
        db.commit()

        return {
            "return_id": return_id,
            "return_ref": return_req.return_ref,
            "risk_category": abuse_res["risk_category"],
            "abuse_probability": p_abuse,
            "defect_probability": p_defect,
            "predicted_salvage_rate": salvage_rate,
            "selected_action": selected_action,
            "expected_loss_selected": chosen_loss,
            "baseline_action": baseline_res["baseline_action"],
            "baseline_expected_loss": baseline_res["baseline_direct_loss"],
            "loss_prevented": loss_prevented,
            "reasoning_summary": explanation["summary"],
            "detailed_explanation": explanation["detailed"],
            "evidence_list": evidence_list,
            "payoff_matrix": payoff_matrix,
            "ml_components": ml_components,
            "ml_results": ml_components,
            "investigated_at": datetime.datetime.utcnow(),
            "is_rerun": is_rerun
        }

investigator_agent = AutonomousReturnInvestigator()
