from typing import Dict, Any, List

class EvidenceCollector:
    """
    Evidence Collection Agent Module.
    Extracts structured, human-interpretable evidence items from customer history,
    product defect records, and the current return context.
    """

    @staticmethod
    def collect_evidence(
        customer_data: Dict[str, Any],
        product_data: Dict[str, Any],
        return_data: Dict[str, Any],
        ml_results: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        evidence = []

        # 1. Customer History Signals
        return_rate = float(customer_data.get("return_rate", 0.0))
        total_orders = int(customer_data.get("total_orders", 1))
        wardrober_score = float(customer_data.get("serial_wardrober_score", 0.0))
        wardrobing_flags = int(customer_data.get("wardrobing_flag_count", 0))
        
        if return_rate >= 0.45:
            evidence.append({
                "category": "CUSTOMER_BEHAVIOR",
                "title": f"High Historical Return Velocity ({round(return_rate * 100, 1)}%)",
                "description": f"Customer has returned {customer_data.get('total_returns', 0)} out of {total_orders} lifetime orders, significantly exceeding store average (12%).",
                "severity": "HIGH",
                "impact": "ABUSE_INDICATOR"
            })
        elif return_rate <= 0.10:
            evidence.append({
                "category": "CUSTOMER_BEHAVIOR",
                "title": f"Low Return Rate History ({round(return_rate * 100, 1)}%)",
                "description": f"Customer has a solid history of retaining purchases ({total_orders} lifetime orders).",
                "severity": "LOW",
                "impact": "LEGITIMACY_INDICATOR"
            })

        if wardrober_score >= 0.60 or wardrobing_flags >= 2:
            evidence.append({
                "category": "CUSTOMER_BEHAVIOR",
                "title": f"Wardrobing & Tag Abuse Signal (Index: {round(wardrober_score, 2)})",
                "description": f"Identified recurring pattern of Friday-purchase/Monday-return or event-aligned returns with {wardrobing_flags} prior wear flags.",
                "severity": "HIGH",
                "impact": "ABUSE_INDICATOR"
            })

        # 2. Product Defect Signals
        batch_defect_rate = float(product_data.get("batch_defect_rate", 0.02))
        batch_number = product_data.get("batch_number", "N/A")
        if batch_defect_rate >= 0.06:
            evidence.append({
                "category": "PRODUCT_DEFECT",
                "title": f"Known Manufacturing Defect Batch ({round(batch_defect_rate * 100, 1)}%)",
                "description": f"Batch {batch_number} exhibits a {round(batch_defect_rate * 100, 1)}% defect report rate across multi-customer returns. Defect claim is highly plausible.",
                "severity": "HIGH",
                "impact": "LEGITIMACY_INDICATOR"
            })
        elif product_data.get("requires_serial_check", False):
            evidence.append({
                "category": "PRODUCT_DEFECT",
                "title": "Serial Numbered High-Shrink Asset",
                "description": "Item is serialized electronics prone to counterfeit swap or empty box return. Physical check recommended.",
                "severity": "MEDIUM",
                "impact": "ABUSE_INDICATOR"
            })

        # 3. Timing & Condition Signals
        days_since_delivery = int(return_data.get("days_since_delivery", 3))
        photos_provided = return_data.get("photos_provided", False)
        
        if days_since_delivery > 25:
            evidence.append({
                "category": "RETURN_TIMING",
                "title": f"Late Return Request ({days_since_delivery} Days Post-Delivery)",
                "description": "Return initiated near standard 30-day window expiration, increasing depreciation risk.",
                "severity": "MEDIUM",
                "impact": "ABUSE_INDICATOR"
            })
        elif days_since_delivery <= 2:
            evidence.append({
                "category": "RETURN_TIMING",
                "title": f"Rapid Return Request ({days_since_delivery} Days Post-Delivery)",
                "description": "Prompt return upon receipt, typical of immediate sizing misfit or out-of-box defect.",
                "severity": "LOW",
                "impact": "LEGITIMACY_INDICATOR"
            })

        if photos_provided:
            evidence.append({
                "category": "TEXT_SEMANTICS",
                "title": "Photographic Verification Provided",
                "description": "Customer uploaded supporting image evidence corroborating item state.",
                "severity": "LOW",
                "impact": "LEGITIMACY_INDICATOR"
            })
        else:
            evidence.append({
                "category": "TEXT_SEMANTICS",
                "title": "No Photographic Proof Provided",
                "description": "Claim lacks upfront visual verification for claimed condition.",
                "severity": "LOW",
                "impact": "NEUTRAL"
            })

        # 4. Reason Discrepancy Signal
        reason_ml = ml_results.get("reason_classification", {})
        if reason_ml.get("is_discrepancy", False):
            evidence.append({
                "category": "TEXT_SEMANTICS",
                "title": "Claim Semantic Inconsistency Detected",
                "description": reason_ml.get("discrepancy_note", "Discrepancy detected between reason and comments."),
                "severity": "HIGH",
                "impact": "ABUSE_INDICATOR"
            })

        return evidence
