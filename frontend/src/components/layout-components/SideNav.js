import React from "react";
import { Layout } from 'antd';
import { connect } from 'react-redux';
import { LogoutOutlined } from '@ant-design/icons';
import { SIDE_NAV_WIDTH, SIDE_NAV_DARK, NAV_TYPE_SIDE } from 'constants/ThemeConstant';
import { signOut } from 'redux/actions/Auth';
import MenuContent from './MenuContent'

const { Sider } = Layout;

export const SideNav = ({navCollapsed, sideNavTheme, routeInfo, hideGroupTitle, localization = true, signOut }) => {
  const props = { sideNavTheme, routeInfo , hideGroupTitle, localization}
  return (
    <Sider 
      className={`side-nav ${sideNavTheme === SIDE_NAV_DARK? 'side-nav-dark' : ''}`} 
      width={SIDE_NAV_WIDTH} 
      collapsed={navCollapsed}
    >
      <MenuContent 
        type={NAV_TYPE_SIDE} 
        {...props}
      />
      <div className="side-nav-exit">
        <button className="side-nav-exit-btn" type="button" onClick={signOut} aria-label="Đăng xuất">
          <LogoutOutlined />
        </button>
      </div>
    </Sider>
  )
}

const mapStateToProps = ({ theme }) => {
  const { navCollapsed, sideNavTheme } =  theme;
  return { navCollapsed, sideNavTheme }
};

export default connect(mapStateToProps, {signOut})(SideNav);