import ITEMS from 'common/ITEMS';
import SPELLS from 'common/SPELLS';
import Module from 'Parser/Core/Module';

const debug = true;
const PETRICHOR_REDUCTION = 2000;

class PetrichorLagniappe extends Module {
  REVIVAL_BASE_COOLDOWN = 0;
  totalReductionTime = 0;
  currentReductionTime = 0;
  wastedReductionTime = 0;
  initialWastedReductionTime = 0;
  casts = 0;
  lastCastTime = 0;


  on_initialized() {
    if (!this.owner.error) {
      this.active = this.owner.selectedCombatant.hasWrists(ITEMS.PETRICHOR_LAGNIAPPE.id);
    }
    if(this.active) {
      this.REVIVAL_BASE_COOLDOWN = 180000 - (this.owner.selectedCombatant.traitsBySpellId[SPELLS.TENDRILS_OF_REVIVAL.id] || 0 ) * 10000;
    }
  }

  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;

    if (spellId === SPELLS.REVIVAL.id) {
      if (this.casts !== 0) {
        this.wastedReductionTime += (event.timestamp - this.lastCastTime) - (this.REVIVAL_BASE_COOLDOWN - this.currentReductionTime);
        this.lastCastTime = event.timestamp;
        this.currentReductionTime = 0;
      }
      // Tracking initial Revival cast - Any REM casts before this are considered wasted.
      if (this.casts === 0) {
        this.wastedReductionTime += this.currentReductionTime;
        this.initialWastedReductionTime = this.currentReductionTime;
        this.casts++;
        this.lastCastTime = event.timestamp;
        this.currentReductionTime = 0;
      }
    }

    if (spellId === SPELLS.RENEWING_MIST.id) {
      this.totalReductionTime += PETRICHOR_REDUCTION;
      this.currentReductionTime += PETRICHOR_REDUCTION;
    }
  }

  on_finished() {
    if (((this.owner.fight.end_time - this.lastCastTime) - (this.REVIVAL_BASE_COOLDOWN - this.currentReductionTime)) > 0 ) {
      this.wastedReductionTime += (this.owner.fight.end_time - this.lastCastTime) - (this.REVIVAL_BASE_COOLDOWN - this.currentReductionTime);
    }
    if(debug) {
      console.log('Time Reduction: ', this.totalReductionTime);
      console.log('Wasted Reduction:', this.wastedReductionTime);
    }
  }
}

export default PetrichorLagniappe;
