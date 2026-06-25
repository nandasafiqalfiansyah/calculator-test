class MaterialGrade {
    constructor(name, E, E90, G, G90) {
        this.name = name;
        this.E = E;       // MPa - modulus of elasticity parallel to grain
        this.E90 = E90;   // MPa - modulus of elasticity perpendicular to grain
        this.G = G;       // MPa - shear modulus parallel to grain
        this.G90 = G90;   // MPa - shear modulus perpendicular to grain
    }
}

// Predefined material grades
MaterialGrade.MGP10 = new MaterialGrade('MGP10', 1100, 110, 687.5, 62.5);
MaterialGrade.MGP12 = new MaterialGrade('MGP12', 1100, 110, 687.5, 62.5);