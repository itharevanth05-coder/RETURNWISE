from typing import Dict, Any
import numpy as np

class FeatureStore:
    """
    Feature Store & Transformer for Return Requests.
    Extracts tabular and text signals for all 5 ML models.
    """

    @staticmethod
    def extract_features(
        customer_data: Dict[str, Any],
        product_data: Dict[str, Any],
        return_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Combines customer history, product metrics, and current return details.
        """
        price = float(product_data.get("price", 50.0))
        cost_price = float(product_data.get("cost_price", 25.0))
        days_since_delivery = int(return_data.get("days_since_delivery", 3))
        photos_provided = 1 if return_data.get("photos_provided", False) else 0
        
        # Customer behavior signals
        total_orders = max(1, int(customer_data.get("total_orders", 1)))
        total_returns = int(customer_data.get("total_returns", 0))
        customer_return_rate = float(customer_data.get("return_rate", total_returns / total_orders))
        wardrober_score = float(customer_data.get("serial_wardrober_score", 0.0))
        wardrobing_flags = int(customer_data.get("wardrobing_flag_count", 0))
        
        # Product defect signals
        batch_defect_rate = float(product_data.get("batch_defect_rate", 0.02))
        historical_return_rate = float(product_data.get("historical_return_rate", 0.08))
        is_high_shrink = 1 if product_data.get("is_high_shrink", False) else 0
        requires_serial_check = 1 if product_data.get("requires_serial_check", False) else 0
        
        # Text comment & stated reason
        stated_reason = str(return_data.get("stated_reason", "CHANGED_MIND"))
        customer_comment = str(return_data.get("customer_comment", "") or "").lower()
        claimed_condition = str(return_data.get("claimed_condition", "UNOPENED"))

        # Derived interaction features
        high_ticket_flag = 1 if price > 150.0 else 0
        fast_return_flag = 1 if days_since_delivery <= 2 else 0
        delayed_return_flag = 1 if days_since_delivery > 20 else 0
        
        # Wardrobing keyword detection in comment
        wardrobe_keywords = ["worn", "party", "event", "night", "wedding", "photoshoot", "weekend", "tags"]
        wardrobe_keyword_hits = sum(1 for kw in wardrobe_keywords if kw in customer_comment)
        
        # Defect keyword detection in comment
        defect_keywords = ["broken", "defect", "scratch", "stopped working", "malfunction", "damaged", "faulty", "dead", "cracked"]
        defect_keyword_hits = sum(1 for kw in defect_keywords if kw in customer_comment)

        return {
            # Customer Vector
            "customer_return_rate": customer_return_rate,
            "wardrober_score": wardrober_score,
            "wardrobing_flags": wardrobing_flags,
            "total_orders": total_orders,
            
            # Product Vector
            "price": price,
            "cost_price": cost_price,
            "batch_defect_rate": batch_defect_rate,
            "historical_return_rate": historical_return_rate,
            "is_high_shrink": is_high_shrink,
            "requires_serial_check": requires_serial_check,
            
            # Return Context Vector
            "days_since_delivery": days_since_delivery,
            "photos_provided": photos_provided,
            "high_ticket_flag": high_ticket_flag,
            "fast_return_flag": fast_return_flag,
            "delayed_return_flag": delayed_return_flag,
            "wardrobe_keyword_hits": wardrobe_keyword_hits,
            "defect_keyword_hits": defect_keyword_hits,
            "stated_reason": stated_reason,
            "claimed_condition": claimed_condition,
            "customer_comment": customer_comment
        }
