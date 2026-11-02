"""
Configurable Synthetic Compliance Rules based on AICTE Approval Process Handbook (APH) norms.
All rules are declarative and explainable.
"""

DEFAULT_RULES = [
    {
        "rule_code": "RULE-INFRA-AREA",
        "name": "Minimum Built-up Area Requirement",
        "category": "ALL",
        "description": "Total instructional and administrative built-up carpet area must meet minimum statutory norms (at least 4.0 sq.m per total student intake).",
        "rule_type": "NUMERIC_RANGE",
        "severity": "CRITICAL",
        "handbook_reference": "AICTE APH 2026-27 Clause 4.1.2 - Norms for Land and Built-up Area",
        "condition_json": {
            "type": "min_ratio",
            "numerator_field": "built_up_area_sqm",
            "denominator_field": "total_approved_intake",
            "min_ratio_value": 4.0,
            "unit": "sq.m / student"
        }
    },
    {
        "rule_code": "RULE-LAND-MINIMUM",
        "name": "Minimum Contiguous Land Norm",
        "category": "ALL",
        "description": "Institution must possess requisite clear title contiguous land area in acres based on urban/rural classification.",
        "rule_type": "NUMERIC_RANGE",
        "severity": "CRITICAL",
        "handbook_reference": "AICTE APH 2026-27 Clause 4.1.1 - Land Requirements for Technical Institutions",
        "condition_json": {
            "type": "min_value",
            "field": "land_area_acres",
            "min_val": 2.5,
            "unit": "Acres"
        }
    },
    {
        "rule_code": "RULE-FACULTY-RATIO",
        "name": "Faculty-to-Student Ratio (Cadre Ratio)",
        "category": "ALL",
        "description": "The institution must maintain a qualified faculty to student cadre ratio of at least 1:20 (0.05 faculty per student).",
        "rule_type": "CROSS_FIELD_CONSISTENCY",
        "severity": "CRITICAL",
        "handbook_reference": "AICTE APH 2026-27 Clause 6.1 - Norms for Faculty Cadre and Qualifications",
        "condition_json": {
            "type": "min_ratio",
            "numerator_field": "total_faculty_count",
            "denominator_field": "total_approved_intake",
            "min_ratio_value": 0.05,
            "unit": "Faculty per Student (1:20 ratio)"
        }
    },
    {
        "rule_code": "RULE-DOC-LAND",
        "name": "Land Title Deed / Ownership Document",
        "category": "ALL",
        "description": "Registered Land Sale Deed or 30+ year Govt/Registered Lease Deed must be uploaded and verified.",
        "rule_type": "REQUIRED_DOCUMENT",
        "severity": "CRITICAL",
        "handbook_reference": "AICTE APH 2026-27 Appendix 16 - Essential Documents for Scrutiny",
        "condition_json": {
            "type": "required_document_category",
            "document_category": "LAND_DOCUMENTS"
        }
    },
    {
        "rule_code": "RULE-DOC-BUILDING",
        "name": "Approved Building Plan & Occupancy Certificate",
        "category": "ALL",
        "description": "Building Plan approved by competent Town Planning Authority / Municipal Corporation with Occupancy Certificate.",
        "rule_type": "REQUIRED_DOCUMENT",
        "severity": "CRITICAL",
        "handbook_reference": "AICTE APH 2026-27 Appendix 16.2 - Architectural & Structural Approvals",
        "condition_json": {
            "type": "required_document_category",
            "document_category": "BUILDING_PLAN"
        }
    },
    {
        "rule_code": "RULE-DOC-FIRE-SAFETY",
        "name": "Fire & Life Safety NOC",
        "category": "ALL",
        "description": "Valid Fire and Life Safety Certificate issued by the State Fire Services Authority.",
        "rule_type": "REQUIRED_DOCUMENT",
        "severity": "HIGH",
        "handbook_reference": "AICTE APH 2026-27 Clause 7.8 - Safety and Disaster Management Norms",
        "condition_json": {
            "type": "required_document_category",
            "document_category": "FIRE_SAFETY_NOC"
        }
    },
    {
        "rule_code": "RULE-FINANCIAL-CORPUS",
        "name": "FDR / Corpus Reserve Fund",
        "category": "NEW_PROGRAM",
        "description": "Fixed Deposit Receipt (FDR) / Joint Corpus Fund of at least INR 50 Lakhs in the name of the Trust/Society and AICTE.",
        "rule_type": "NUMERIC_RANGE",
        "severity": "HIGH",
        "handbook_reference": "AICTE APH 2026-27 Clause 5.2 - Security Deposit Requirements",
        "condition_json": {
            "type": "min_value",
            "field": "corpus_fund_lakhs",
            "min_val": 50.0,
            "unit": "Lakhs INR"
        }
    },
    {
        "rule_code": "RULE-BARRIER-FREE",
        "name": "Barrier Free Environment & Ramp Facilities",
        "category": "ALL",
        "description": "Provision of lifts/ramps and disabled-friendly toilets in accordance with Rights of Persons with Disabilities Act 2016.",
        "rule_type": "REQUIRED_FIELD",
        "severity": "MEDIUM",
        "handbook_reference": "AICTE APH 2026-27 Clause 7.12 - Divyangjan Facilities",
        "condition_json": {
            "type": "boolean_true",
            "field": "has_barrier_free_environment"
        }
    }
]
