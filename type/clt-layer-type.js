class CLTLayerType {
    /**
     * @param {number} thickness - Layer thickness in mm
     * @param {number} orientation - 0 for parallel (0°), 90 for perpendicular (90°)
     * @param {MaterialGrade} materialGrade - Material grade properties
     */
    constructor(thickness, orientation, materialGrade) {
        this.id = CLTLayerType._nextId++;
        this.thickness = thickness;      // mm
        this.orientation = orientation;  // 0° or 90°
        this.materialGrade = materialGrade;
    }

    /**
     * Get the effective E modulus based on orientation
     */
    get E() {
        return this.orientation === 0 ? this.materialGrade.E : this.materialGrade.E90;
    }

    /**
     * Get the effective G modulus based on orientation
     */
    get G() {
        return this.orientation === 0 ? this.materialGrade.G : this.materialGrade.G90;
    }
}

CLTLayerType._nextId = 1;