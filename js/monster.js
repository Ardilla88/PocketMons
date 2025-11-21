export const MonsterType = {
    RED_MON: { name: 'RedMon', color: '#ff5252', hp: 20, attack: 5 },
    BLUE_MON: { name: 'BlueMon', color: '#448aff', hp: 25, attack: 4 },
    GREEN_MON: { name: 'GreenMon', color: '#69f0ae', hp: 30, attack: 3 }
};

export class Monster {
    constructor(type, level = 1) {
        this.name = type.name;
        this.color = type.color;
        this.maxHp = type.hp + (level * 2);
        this.currentHp = this.maxHp;
        this.attack = type.attack + level;
        this.level = level;
        this.id = Math.random().toString(36).substr(2, 9); // Unique ID
    }

    static generateRandom(level = 1) {
        const types = Object.values(MonsterType);
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new Monster(randomType, level);
    }
}
