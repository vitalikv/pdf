import { isometricSvgElem, isometricSvgElementColor } from '../index';

// класс для получения и передачи атрибутов на фронт
export class IsometricSvgElementAttributes {
  getAttributes({ event, svg, attr }) {
    this.createModalDiv({ event, svg, attr });
  }

  setAttributes({ svg, attr }) {
    svg['userData'].attributes = attr;
  }

  // создание меню, при клики правой кнопкой
  createModalDiv({ event, svg, attr }) {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const bound = containerSvg.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    let div = document.createElement('div');
    div.innerHTML = `
      <div nameId="modalWindAttr" style="position: absolute; left: 30px; font-family: Gostcadkk; font-size: 18px; z-index: 5; box-sizing: border-box; background: #F0F0F0; border: 1px solid #D1D1D1;">
        <div nameId="content" style="display: flex; flex-direction: column;">
          <div style="margin: 10px auto;">Свойства</div>
          <div nameId="container"></div>
          
          <div nameId="btnAddItem" style="display: flex; justify-content: center; align-items: center; width: 30px; padding: 5px 0; margin: 10px  auto; font-size: 18px; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;">+</div>
  
          <div nameId="btnSave" style="display: flex; justify-content: center; align-items: center; padding: 5px 0; margin: 10px; font-size: 18px; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;">
            <div>сохранить</div>
          </div>

          <div style="display: flex; margin: 20px auto;">
            <div nameId="btnColor1" style="width: 20px; height: 20px; margin: 0px 20px; background: #00ff00; cursor: pointer;"></div>
            <div nameId="btnColor2" style="width: 20px; height: 20px; margin: 0px 20px; background: #0000ff; cursor: pointer;"></div>
          </div>
        </div>
      </div>`;

    let divModal = div.children[0];

    const containerTexts = containerSvg.querySelector('[nameId="notesText"]');
    containerTexts.append(divModal);

    const divContainer = divModal.querySelector('[nameId="container"]');
    const btnAddItem = divModal.querySelector('[nameId="btnAddItem"]');
    const btnSave = divModal.querySelector('[nameId="btnSave"]');

    const bound2 = divModal.getBoundingClientRect();
    divModal['style'].left = x + 'px';
    divModal['style'].top = y + 'px';

    const divAttrs = [];
    const createDivItem = ({ key, value }) => {
      let div = document.createElement('div');

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px;">
          <input type="text" value="${key}" nameId="inputKey" style="width: 70px; height: 25px; margin-right: 10px; border: 1px solid #D1D1D1; outline: none;">
          <input type="text" value="${value}" nameId="inputValue" style="width: 100px; height: 25px; border: 1px solid #D1D1D1; outline: none;">
        </div>`;

      let divItem = div.children[0];
      divContainer.append(divItem);

      divAttrs.push({ inputKey: divItem.querySelector('[nameId="inputKey"]'), inputValue: divItem.querySelector('[nameId="inputValue"]') });
    };

    const deleteModalDiv = () => {
      divModal.remove();
    };

    for (let key in attr) {
      createDivItem({ key, value: attr[key] });
    }

    btnAddItem['onmousedown'] = (e) => {
      createDivItem({ key: '', value: '' });
    };

    btnSave['onmousedown'] = (e) => {
      const attr = {};
      divAttrs.forEach((item) => {
        if (item.inputKey['value'].length > 0) {
          attr[item.inputKey['value']] = item.inputValue['value'];
        }
      });
      this.setAttributes({ svg, attr });

      deleteModalDiv();
    };

    const btnColor1 = divModal.querySelector('[nameId="btnColor1"]');
    const btnColor2 = divModal.querySelector('[nameId="btnColor2"]');

    btnColor1.onmousedown = (e) => {
      isometricSvgElementColor.setColor({ color: btnColor1.style.background });
      console.log(btnColor1.style.background);
    };
    btnColor2.onmousedown = (e) => {
      isometricSvgElementColor.setColor({ color: btnColor2.style.background });
      console.log(btnColor2.style.background);
    };

    divModal['onmousedown'] = (e) => {
      e.stopPropagation();
    };

    return divModal;
  }
}
