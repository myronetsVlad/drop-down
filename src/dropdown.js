class DropDown {
  #selector;
  #searchSelector;
  #closePopUpSelector;
  #dropDownItems = [];
  #copyDropDownItems = [];
  #iternalElements = {};
  #initialElements = [
    {
      type: 'div',
      props: {
        id: 'selectedListBody', 
      }
    },
    {
      type: 'div',
      props: {
        id: 'dropdownBody', 
      }
    },
  ];
  


  constructor(items) {
    this.#dropDownItems = this.#sortItemList(items);
  }

  $mount(parentSelector, searchField, closePopUpSelector) {
    this.#selector = document.querySelector(parentSelector);
    this.#searchSelector = document.querySelector(searchField);
    this.#closePopUpSelector = document.querySelector(closePopUpSelector);
    this.#copyDropDownItems = [...this.#dropDownItems];
    this.#init();
  }

  #sortItemList(list) {
    return list.sort((curEl, prevEl) => {
      return (curEl.groupId > prevEl.groupId) ? 1 : ((prevEl.groupId > curEl.groupId) ? -1 : 0);
    });
  }

  #init() {
    if(!this.#copyDropDownItems.length) return;

    this.#initialElements.forEach(htmlEl => {
      const element = this.#generateHTMLElement(htmlEl.type, htmlEl.props);
      this.#selector.appendChild(element);
      this.#setIternalSelectors(htmlEl.props);
    });

    this.#onRender(this.#copyDropDownItems);
    this.#renderLabels(this.#copyDropDownItems);
    this.#bindEventHandlers();
  }

  #createGroupBody(list) {
    const { dropdownBody } = this.#iternalElements;
    
    list.forEach((element, index) => {
      if(element.groupId !== list[index + 1]?.groupId) {
        const div = this.#generateHTMLElement('div', {
          'data-group': element.groupId,
        });
        div.innerHTML = `<span>${element.groupId}</span>`;
        dropdownBody.appendChild(div);
      }
    });
  }

  #onRender(list) {
    const { dropdownBody } = this.#iternalElements;
    dropdownBody.innerHTML = '';
    this.#createGroupBody(list);
    this.#onShow(list);
  }

  #onShow(list) {
    list.forEach((element) => { 
      const groupBodyByAttr = document.querySelector(`[data-group=${element.groupId}]`);
      const attr = groupBodyByAttr.getAttribute('data-group');
      if(element.groupId === attr) {
        groupBodyByAttr.appendChild(this.#template(element));
      }
    });
  }

  #template({id, label, groupId, isSelected}) {
    const props = {
      'class': 'item-wrapper'
    };
    const element = this.#generateHTMLElement('div', props);
    const isActive = isSelected ? 'active' : '';

    element.innerHTML = `
      <label for='${id}' data-id='${id}' class='${isActive}' tabindex=0>
        <input type="checkbox" id='${id}' data-hidden='true'/>
        <div class='checkbox'><i>&#10004;</i></div>
        ${label}
      </label>
      <div class='sub-group-dropdown-wrapper' tabindex=0 role='list'>
        <div class='sub-group-dropdown' data-list-id='${id}' aria-pressed="false" role='button' data-visibel='hidden'>${groupId}</div>
        <div class='sub-group-dropdown-list' >
          ${this.#generateSubGroupDropDown(groupId, id)}
        </div>
      </div>
      `
    return element
  }

  #generateSubGroupDropDown(groupId, id) {
    const elements = [];

    this.#dropDownItems.forEach((subGroups, index) => {
      if(subGroups.groupId === this.#dropDownItems[index + 1]?.groupId) return;

      const isActive = subGroups.groupId === groupId ? 'active' : '';
      const option = `<div class='sub-group-option ${isActive}' data-selected-id='${id}' role='option' data-option='${subGroups.groupId}'>
                        ${subGroups.groupId}
                      </div>`
      elements.push(option);          
    })

    return elements.join('');
  }

  #generateHTMLElement(type, options = null) {
    const element = document.createElement(type);
    if(!options) return element;

    for(const attribute in options) {
      element.setAttribute(attribute, options[attribute]);
    }

    return element;
  }

  #renderLabels(list) {
    const { selectedListBody } = this.#iternalElements;
    selectedListBody.innerHTML = '';

    list.forEach(({label, id, isSelected}) => {
      if(isSelected) {
        const badge = this.#generateHTMLElement('span', {
          'data-id': id ,
        });
        badge.innerHTML = label;
        selectedListBody.appendChild(badge);
      }
    })
  }

  #setIternalSelectors({ id }) {
    this.#iternalElements = {
      ...this.#iternalElements,
      [id]: document.querySelector(`#${id}`)
    };
  }

  #bindEventHandlers() {
    const { selectedListBody, dropdownBody } = this.#iternalElements;
    
    selectedListBody.addEventListener('click', this.#selectItem.bind(this));
    dropdownBody.addEventListener('click', this.#selectItem.bind(this));

    this.#searchSelector.addEventListener('input', this.#searchHandler.bind(this));
    this.#searchSelector.addEventListener('focus', this.#openDropDown.bind(this));
    
    this.#bindSubDropDownEvents();
  }

  #openDropDown() {
    if(this.#searchSelector.classList.contains('active')) return;
    this.#closePopUpSelector.addEventListener('click', this.#closePopUp.bind(this));
    this.#searchSelector.classList.add('active')
  }

  #closePopUp() {
    this.#searchSelector.classList.remove('active');
    this.#closePopUpSelector.removeEventListener('click', this.#closePopUp);
  }

  #closeSubGroupDropDown() {
    const subGroupDropDown = document.querySelector('[data-visibel=visibel]');
    subGroupDropDown?.setAttribute('data-visibel', 'hidden')
  }

  #bindSubDropDownEvents() {
    const subGroupsButtons = document.querySelectorAll('.sub-group-dropdown-wrapper');
    subGroupsButtons.forEach(button => {
      button.addEventListener('blur', this.#closeSubGroupDropDown.bind(this));
      button.addEventListener('click', this.#selectGroupHandler.bind(this));
    });

  }

  #unbindSubDropDownEvents() {
    const subGroupsButtons = document.querySelectorAll('.sub-group-dropdown-wrapper');
    subGroupsButtons.forEach(button => {
      button.removeEventListener('blur', this.#closeSubGroupDropDown.bind(this));
      button.removeEventListener('click', this.#selectGroupHandler.bind(this))
    });
  }

  #selectGroupHandler(event) {
    event.stopPropagation();
    const { target } = event;
    
    if(target.dataset.visibel === 'hidden') {
       target.setAttribute('data-visibel', 'visibel')
    } else {
      this.#setGroup(target.dataset);
    }
  }

  #setGroup(properties) {
    if(properties.visibel ) {
      return properties.visibel = 'hidden';
    }

    const indexOfSelectedElement = this.#findIndex(this.#copyDropDownItems, properties.selectedId)
    const element = this.#copyDropDownItems[indexOfSelectedElement];

    if(element?.groupId !== properties.groupId) {
      this.#copyDropDownItems.splice(indexOfSelectedElement, 1, {
        ...element,
        groupId: properties.option
      });
      this.#unbindSubDropDownEvents();
      this.#onRender(this.#sortItemList(this.#copyDropDownItems));
      this.#bindSubDropDownEvents();
    }
  }

  #findIndex(list, id) {
    const findIndexCB = item => item.id === id;
    return list.findIndex(findIndexCB);
  }

  #selectItem(event) {
    event.stopPropagation();
  
    const { target } = event;
    if(!target.dataset.id) return;
     
    this.#addToSelectedItems(target.dataset.id)
  }

  #addToSelectedItems(id) {
    const [ selectedItem ] = this.#copyDropDownItems.filter(item => item.id === id);
    const { dropdownBody } = this.#iternalElements;
    selectedItem.isSelected = !selectedItem.isSelected;
    this.#renderLabels(this.#copyDropDownItems);

    dropdownBody.querySelector(`[data-id='${selectedItem.id}']`).classList.toggle('active');
  }

  #rollBackListAfterSearch() {
   const list = this.#dropDownItems.map((item, i) => {
      const itemForUpdate = this.#copyDropDownItems.find(updated => updated.id === item.id )
      if(itemForUpdate) {
        return {
          ...item,
          ...itemForUpdate
        }
      } else {
        return item
      }
    });

    this.#copyDropDownItems = this.#sortItemList(list);
  }

  #searchHandler(event) {
    const { target: { value } } = event;
    const { dropdownBody, selectedListBody } = this.#iternalElements;
    let coincidencesEl = [];

    this.#rollBackListAfterSearch();

    if(!value) {
      this.#unbindSubDropDownEvents();
      this.#onRender(this.#copyDropDownItems);
      this.#bindSubDropDownEvents();
      this.#renderLabels(this.#copyDropDownItems);
      return;
    }

    this.#copyDropDownItems.forEach(element => {
      selectedListBody.innerHTML = '';
      if(element.label.substring(0, value.length) === value) {
        coincidencesEl.push(element);
      }
    });

    if(!coincidencesEl.length) {
      return dropdownBody.innerHTML = 'Empty(';
    }
    
    this.#copyDropDownItems = coincidencesEl;
    this.#unbindSubDropDownEvents();
    this.#onRender(this.#copyDropDownItems);
    this.#renderLabels(this.#copyDropDownItems)
    this.#bindSubDropDownEvents();
  }
}

new DropDown([
  {
    id: uuidv4(),
    label: 'Coca-Cola',
    groupId: 'Something',
    isSelected: false
  },
  {
    id: uuidv4(),
    label: 'Carrot',
    groupId: 'Vegatabel',
    isSelected: false
  },
  {
    id: uuidv4(),
    label: 'Apple',
    groupId: 'Fruits',
    isSelected: true
  },
  {
    id: uuidv4(),
    label: 'Orange',
    groupId: 'Fruits',
    isSelected: false
  },
  {
    id: uuidv4(),
    label: 'Potato',
    groupId: 'Vegatabel',
    isSelected: false
  }
]).$mount('.dropdown__list', '#search', '#close-popup-overlay');

