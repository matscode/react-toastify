/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import ToastContainer from './../ToastContainer';
import toaster from './../toaster';

import { ACTION } from './../constant';
import EventManager from './../util/EventManager';

jest.useFakeTimers();

function hasProp(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// extract props from component instance
function getToastProps(component){
  const collection = component.instance().collection;
  const toast = collection[Object.keys(collection)[0]];

  return toast.content.props;
}

describe('ToastContainer', () => {
  it('Should bind event when mounted and unbind them when unmounted', () => {
    const component = mount(<ToastContainer />);

    expect(EventManager.eventList.has(ACTION.SHOW)).toBeTruthy();
    expect(EventManager.eventList.has(ACTION.CLEAR)).toBeTruthy();

    component.unmount();
    expect(EventManager.eventList.has(ACTION.SHOW)).toBeFalsy();
    expect(EventManager.eventList.has(ACTION.CLEAR)).toBeFalsy();
  });

  it(`Should always pass down to Toast the props: 
    -autoClose
    -closeButton
    -children
    -position
    -pauseOnHover
    -transition
    -closeToast`, () => {
    const component = mount(<ToastContainer />);
    // Create a toast
    toaster('coucou');
    jest.runAllTimers();
    
    const props = getToastProps(component);

    [
      'autoClose',
      'closeButton',
      'children',
      'position',
      'closeToast',
      'transition',
      'pauseOnHover'
    ].forEach(key => expect(hasProp(props, key)).toBeTruthy());
  });

  it("Should clear all toast when clear is called without id", () => {
    const component = mount(<ToastContainer />);
    
    toaster('coucou');
    toaster('coucou');
    jest.runAllTimers();

    expect(component.state().toast).toHaveLength(2);

    toaster.dismiss();
    jest.runAllTimers();

    expect(component.state().toast).toHaveLength(0);
  });

  it("Should be able to render a react element, a string or a number without crashing", () => {
    const component = mount(<ToastContainer />);
    toaster('coucou');
    toaster(123);
    toaster(<div>plop</div>);
    jest.runAllTimers();

    expect(component.state().toast).toHaveLength(3);
  });

  
  it("Should be able to display new toast on top", () => {
    Array.prototype.reverse = jest.fn(Array.prototype.reverse);
    mount(<ToastContainer newestOnTop />);
    toaster('hello');
    toaster(123);
    jest.runAllTimers();

    expect(Array.prototype.reverse).toHaveBeenCalled();
  });

  it("Toast options should supersede ToastContainer props", () => {
    const component = mount(<ToastContainer />);
    const CloseBtn = () => <div>Close</div>;
    const fn = () => {};
    const desiredProps = {
      pauseOnHover: false,
      closeOnClick: false,
      onOpen: fn,
      onClose: fn,
      autoClose: false,
      hideProgressBar: true,
      position: "top-left",
      closeButton: <CloseBtn />
    };

    toaster('hello', desiredProps);
    jest.runAllTimers();
   
    const props = getToastProps(component);
    
    expect(props).toMatchObject(desiredProps);
  });

  it("Should be able to disable the close button", () => {
    let component = mount(<ToastContainer />);
    toaster('hello');
    jest.runAllTimers();
    
    // ensure that close button is present by default
    expect(component.html()).toMatch(/toastify__close/);
    component.unmount()

    component = mount(<ToastContainer closeButton={false} />);
    toaster('hello');
    jest.runAllTimers();

    expect(component.html()).not.toMatch(/toastify__close/);
  });

  it("Should merge className and style", () => {
    const component = mount(<ToastContainer className="foo" style={{ background: "red" }} />);
    toaster('hello');
    jest.runAllTimers();

    expect(component.html()).toMatch(/class="toastify .+ foo"/);
    expect(component.html()).toMatch(/style="background: red;"/);
  });

  it("Should pass a closeToast function when displaying a react component", () => {
    const component = mount(<ToastContainer />);
    const Msg = () => <div>Plop</div>;
    
    toaster(<Msg />);
    jest.runAllTimers();

    const props = getToastProps(component);
    
    expect(props).toHaveProperty("closeToast");
  });

  describe("closeToast function", () => {
    it("Should remove toast when closeToast is called by the close button", () => {
      const component = mount(<ToastContainer />);
      const Msg = () => <div>Plop</div>;
      
      toaster(<Msg />);
      jest.runAllTimers();
  
      const props = getToastProps(component);
      
      //ensure that the toast is present
      expect(component.state().toast).toHaveLength(1);
      
      // close the toast with the function passed to the close button
      props.closeButton.props.closeToast()
      jest.runAllTimers();
      
      expect(component.state().toast).toHaveLength(0);
    });

    it("Should remove toast when closeToast is called by the children", () => {
      const component = mount(<ToastContainer />);
      const Msg = () => <div>Plop</div>;
      
      toaster(<Msg />);
      jest.runAllTimers();
  
      const props = getToastProps(component);
      
      //ensure that the toast is present
      expect(component.state().toast).toHaveLength(1);
      
      // close the toast with the function passed to the close button
      props.children.props.closeToast()
      jest.runAllTimers();
      
      expect(component.state().toast).toHaveLength(0);
    });
  });

  // This test should be executed after all the others. 
  it("Should throw an error if can't render a toast", () => {
    mount(<ToastContainer />);
    try {
      toaster(false);
      jest.runAllTimers();
    } catch(err) {
      expect(err.message).toMatch(/The element you provided cannot be rendered/);
    }

    toaster.dismiss();
  });
});
